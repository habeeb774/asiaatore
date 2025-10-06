import { apiGet, apiPost, apiPut } from './apiService';

export function listOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiGet(`/orders${qs ? '?' + qs : ''}`);
}

export function createOrder(order) {
  return apiPost('/orders', order);
}

export function getOrder(id) {
  return apiGet(`/orders/${id}`);
}

export function updateOrder(id, patch) {
  return apiPut(`/orders/${id}`, patch);
}

export function getInvoiceUrl(id) {
  return `/api/orders/${id}/invoice`;
}

export default { listOrders, createOrder, getOrder, updateOrder, getInvoiceUrl };