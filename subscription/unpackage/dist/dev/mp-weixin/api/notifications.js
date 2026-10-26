"use strict";
const common_vendor = require("../common/vendor.js");
const api_request = require("./request.js");
const PENDING_KEY = "renewal_notification_authorization_v1";
const notificationApi = {
  status: () => api_request.request("/notifications"),
  authorize: (data) => api_request.request("/notifications/authorization", { method: "POST", data })
};
const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const r = Math.floor(Math.random() * 16);
  return (c === "x" ? r : r & 3 | 8).toString(16);
});
async function syncPendingAuthorization(userId) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const pending = (_b = (_a = common_vendor.index).getStorageSync) == null ? void 0 : _b.call(_a, PENDING_KEY);
  if (!pending)
    return null;
  if (pending.userId !== userId) {
    (_d = (_c = common_vendor.index).removeStorageSync) == null ? void 0 : _d.call(_c, PENDING_KEY);
    return null;
  }
  try {
    const result = await notificationApi.authorize(pending.data);
    (_f = (_e = common_vendor.index).removeStorageSync) == null ? void 0 : _f.call(_e, PENDING_KEY);
    return result;
  } catch (error) {
    if ([400, 422].includes(error.status)) {
      (_h = (_g = common_vendor.index).removeStorageSync) == null ? void 0 : _h.call(_g, PENDING_KEY);
      (_j = (_i = common_vendor.index).showToast) == null ? void 0 : _j.call(_i, { title: "授权记录已失效，请重新授权", icon: "none" });
      return null;
    }
    throw error;
  }
}
function requestNotificationAuthorization(templateId, userId) {
  return new Promise((resolve, reject) => {
    var _a, _b, _c;
    if (((_c = (_b = (_a = common_vendor.index).getStorageSync) == null ? void 0 : _b.call(_a, PENDING_KEY)) == null ? void 0 : _c.userId) === userId)
      return reject(new Error("请先重新加载，确认上一次授权记录"));
    if (typeof common_vendor.index.requestSubscribeMessage !== "function")
      return reject(new Error("请在微信小程序中开启通知"));
    common_vendor.index.requestSubscribeMessage({ tmplIds: [templateId], success(result) {
      const answer = result[templateId];
      if (!["accept", "reject", "ban"].includes(answer))
        return reject(new Error("未获得通知授权，请重试"));
      const data = { requestId: uuid(), templateId, result: answer };
      common_vendor.index.setStorageSync(PENDING_KEY, { userId, data });
      resolve(data);
    }, fail() {
      reject(new Error("通知授权未完成，可在微信设置中检查订阅消息权限"));
    } });
  }).then(async (data) => {
    const status = await syncPendingAuthorization(userId);
    if (!status)
      throw new Error("授权记录未保存，请重新授权");
    return { status, answer: data.result };
  });
}
exports.notificationApi = notificationApi;
exports.requestNotificationAuthorization = requestNotificationAuthorization;
exports.syncPendingAuthorization = syncPendingAuthorization;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/notifications.js.map
