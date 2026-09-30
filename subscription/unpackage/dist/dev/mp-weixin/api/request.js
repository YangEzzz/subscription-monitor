"use strict";
const common_vendor = require("../common/vendor.js");
const api_config = require("./config.js");
const api_auth = require("./auth.js");
const messages = {
  AUTH_NOT_CONFIGURED: "登录服务尚未配置，请稍后重试",
  WECHAT_LOGIN_FAILED: "微信登录失败，请重试",
  WECHAT_UNAVAILABLE: "微信登录暂时不可用，请稍后重试",
  SUBSCRIPTION_LIMIT_REACHED: "免费订阅额度已用完",
  RENEWAL_ALREADY_APPLIED: "本期续费已经确认，请刷新后查看",
  RENEWAL_UNDO_WINDOW_EXPIRED: "已超过十分钟撤销期限",
  BILLING_PERIOD_CHANGED: "本期扣费日已改变，请刷新后重试",
  VALIDATION_ERROR: "填写内容不符合要求，请检查后重试",
  UNAUTHORIZED: "登录状态已失效，请重新进入小程序",
  FORBIDDEN: "当前账号没有执行此操作的权限",
  NOT_FOUND: "记录不存在或已被删除",
  DUPLICATE_RESOURCE: "记录已存在，请刷新后重试",
  TOO_MANY_REQUESTS: "操作过于频繁，请稍后重试",
  INTERNAL_SERVER_ERROR: "服务暂时不可用，请稍后重试"
};
class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, {
      status: options.status || 0,
      code: options.code || "UNKNOWN_ERROR",
      details: options.details,
      requestId: options.requestId || "",
      retriable: Boolean(options.retriable),
      uncertain: Boolean(options.uncertain)
    });
  }
}
const responseRequestId = (response) => {
  var _a;
  const headers = response.header || response.headers || {};
  return ((_a = response.data) == null ? void 0 : _a.requestId) || headers["x-request-id"] || headers["X-Request-Id"] || "";
};
async function sendRequest(path, { method = "GET", data, query } = {}, accessToken) {
  const search = Object.entries(query || {}).filter(([, value]) => value !== void 0 && value !== null).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${api_config.API_CONFIG.baseUrl.replace(/\/$/, "")}${path}${search ? "?" + search : ""}`,
      method,
      data,
      timeout: api_config.API_CONFIG.timeout,
      header: { "Content-Type": "application/json", ...accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300)
          return resolve(response.data);
        const body = response.data || {};
        const detail = typeof body.message === "string" ? body.message : Array.isArray(body.message) ? body.message.join("；") : "";
        reject(new ApiError(messages[body.code] || detail || `请求失败（${response.statusCode}）`, {
          status: response.statusCode,
          code: body.code || `HTTP_${response.statusCode}`,
          details: body.errors,
          requestId: responseRequestId(response),
          retriable: response.statusCode === 408 || response.statusCode === 429 || response.statusCode >= 500
        }));
      },
      fail(cause) {
        const timeout = (cause.errMsg || "").includes("timeout");
        const writing = method !== "GET";
        reject(new ApiError(
          timeout ? "连接超时，请检查网络后重试" : "无法连接服务，请检查网络后重试",
          {
            code: timeout ? "TIMEOUT" : "NETWORK_ERROR",
            retriable: !writing,
            uncertain: writing
          }
        ));
      }
    });
  });
}
async function request(path, options = {}) {
  if (options.auth === false)
    return sendRequest(path, options);
  const session = await api_auth.ensureSession();
  try {
    return await sendRequest(path, options, session.accessToken);
  } catch (error) {
    if (error.status !== 401)
      throw error;
    api_auth.clearSession(session.accessToken);
    if (options.method && options.method !== "GET")
      throw error;
    const renewed = await api_auth.ensureSession();
    try {
      return await sendRequest(path, options, renewed.accessToken);
    } catch (retryError) {
      if (retryError.status === 401)
        api_auth.clearSession(renewed.accessToken);
      throw retryError;
    }
  }
}
exports.ApiError = ApiError;
exports.request = request;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/request.js.map
