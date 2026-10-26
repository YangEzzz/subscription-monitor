"use strict";
const api_request = require("./request.js");
const orderPath = (id) => `/membership/orders/${encodeURIComponent(id)}`;
const membershipApi = {
  refund: (id) => api_request.request(orderPath(id) + "/simulate-refund", { method: "POST" }),
  status: () => api_request.request("/membership"),
  orders: () => api_request.request("/membership/orders"),
  order: (id) => api_request.request(orderPath(id)),
  payment: (id) => api_request.request(orderPath(id) + "/pay", { method: "POST" }),
  create: (requestId) => api_request.request("/membership/orders", {
    method: "POST",
    data: { productId: "lifetime", requestId }
  }),
  simulate: (id, outcome) => api_request.request(orderPath(id) + "/simulate", { method: "POST", data: { outcome } })
};
exports.membershipApi = membershipApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/membership.js.map
