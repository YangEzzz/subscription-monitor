"use strict";
const common_vendor = require("../common/vendor.js");
const api_request = require("./request.js");
const SESSION_KEY = "renewal_wechat_session_v1";
let loginPromise = null;
function getSession() {
  var _a, _b, _c;
  const session = (_b = (_a = common_vendor.index).getStorageSync) == null ? void 0 : _b.call(_a, SESSION_KEY);
  if (!session || typeof session.accessToken !== "string" || !((_c = session.user) == null ? void 0 : _c.id) || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now() + 3e4)
    return null;
  return session;
}
function clearSession(accessToken) {
  var _a, _b, _c, _d;
  const stored = (_b = (_a = common_vendor.index).getStorageSync) == null ? void 0 : _b.call(_a, SESSION_KEY);
  if (!accessToken || (stored == null ? void 0 : stored.accessToken) === accessToken)
    (_d = (_c = common_vendor.index).removeStorageSync) == null ? void 0 : _d.call(_c, SESSION_KEY);
}
function ensureSession() {
  const session = getSession();
  if (session)
    return Promise.resolve(session);
  if (loginPromise)
    return loginPromise;
  loginPromise = new Promise((resolve, reject) => {
    if (typeof common_vendor.index.login !== "function")
      return reject(new api_request.ApiError("请在微信小程序中登录", { code: "WECHAT_LOGIN_FAILED" }));
    common_vendor.index.login({
      provider: "weixin",
      timeout: 1e4,
      success(result) {
        if (!result.code)
          return reject(new api_request.ApiError("未获取到微信登录凭证，请重试", { code: "WECHAT_LOGIN_FAILED" }));
        resolve(result.code);
      },
      fail() {
        reject(new api_request.ApiError("微信登录失败，请重新尝试", { code: "WECHAT_LOGIN_FAILED" }));
      }
    });
  }).then((code) => api_request.request("/auth/wechat", { method: "POST", data: { code }, auth: false })).then((result) => {
    var _a;
    if (typeof (result == null ? void 0 : result.accessToken) !== "string" || !result.accessToken || !((_a = result.user) == null ? void 0 : _a.id) || !Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= Date.now()) {
      throw new api_request.ApiError("登录返回异常，请重试", { code: "WECHAT_LOGIN_FAILED" });
    }
    common_vendor.index.setStorageSync(SESSION_KEY, result);
    return result;
  }).finally(() => {
    loginPromise = null;
  });
  return loginPromise;
}
exports.clearSession = clearSession;
exports.ensureSession = ensureSession;
exports.getSession = getSession;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/auth.js.map
