"use strict";
const common_vendor = require("../common/vendor.js");
const api_config = require("./config.js");
const messages = {
  SUBSCRIPTION_LIMIT_REACHED: "免费订阅额度已用完",
  RENEWAL_ALREADY_APPLIED: "本期续费已经确认，请刷新后查看",
  RENEWAL_UNDO_WINDOW_EXPIRED: "已超过十分钟撤销期限",
  BILLING_PERIOD_CHANGED: "本期扣费日已改变，请刷新后重试"
};
function request(path, { method = "GET", data, query } = {}) {
  const search = Object.entries(query || {}).filter(([, value]) => value !== void 0 && value !== null).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${api_config.API_CONFIG.baseUrl.replace(/\/$/, "")}${path}${search ? "?" + search : ""}`,
      method,
      data,
      timeout: api_config.API_CONFIG.timeout,
      header: { "Content-Type": "application/json", "x-demo-user-id": api_config.API_CONFIG.demoUserId },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300)
          return resolve(response.data);
        const body = response.data || {};
        const detail = typeof body.message === "string" ? body.message : Array.isArray(body.message) ? body.message.join("；") : "";
        const error = new Error(messages[body.code] || detail || (response.statusCode === 422 ? "填写内容不符合要求，请检查表单" : `请求失败（${response.statusCode}）`));
        error.status = response.statusCode;
        error.code = body.code;
        error.details = body.errors;
        reject(error);
      },
      fail(cause) {
        const error = new Error((cause.errMsg || "").includes("timeout") ? "请求超时，请刷新确认结果后重试" : "无法连接后端，请检查服务地址和网络");
        error.code = "NETWORK_ERROR";
        reject(error);
      }
    });
  });
}
exports.request = request;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/request.js.map
