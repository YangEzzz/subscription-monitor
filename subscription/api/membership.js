import { request } from "./request.js";

const orderPath = (id) => `/membership/orders/${encodeURIComponent(id)}`;
export const membershipApi = {
  refund: (id) =>
    request(orderPath(id) + "/simulate-refund", { method: "POST" }),
  status: () => request("/membership"),
  orders: () => request("/membership/orders"),
  order: (id) => request(orderPath(id)),
  create: (requestId) =>
    request("/membership/orders", {
      method: "POST",
      data: { productId: "lifetime", requestId },
    }),
  simulate: (id, outcome) =>
    request(orderPath(id) + "/simulate", { method: "POST", data: { outcome } }),
};
