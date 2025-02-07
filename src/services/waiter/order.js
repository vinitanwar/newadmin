import request from '../request';

const orderService = {
  getAll: (params) =>
    request.get('dashboard/waiter/orders/paginate', { params }),
  getById: (id, params) =>
    request.get(`dashboard/waiter/orders/${id}`, { params }),
  create: (data) => request.post('dashboard/waiter/orders', data),
  update: (id, data) => request.put(`dashboard/waiter/orders/${id}`, data),
  updateStatus: (id, data) =>
    request.post(`dashboard/waiter/order/${id}/status/update`, data),
  delete: (params) =>
    request.delete(`dashboard/waiter/orders/orders/delete`, {
      params,
    }),
  attachToMe: (id) => request.post(`dashboard/waiter/order/${id}/attach/me`),
  calculate: (params) => request.get(`rest/order/products/calculate${params}`),
};

export default orderService;
