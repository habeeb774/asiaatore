import { apiPost, apiPostMultipart } from './apiService';

// Frontend payment service wired to the local stub server routes under /api/pay

export async function createPayPalTransaction(payload = {}) {
  // payload may contain: orderId (local), total, currency, items
  const body = {
    order: {
      total: payload.total ?? payload.amount ?? 0,
      currency: payload.currency ?? 'SAR',
      items: payload.items || []
    },
    localOrderId: payload.orderId || payload.localOrderId || null
  };

  // apiPost('/pay/paypal/create-order') -> final URL: /api/pay/paypal/create-order
  return apiPost('/pay/paypal/create-order', body);
}

export async function capturePayPalOrder({ paypalOrderId, localOrderId } = {}) {
  // prefer sending both; server will accept either param or body
  const body = { paypalOrderId, localOrderId };
  return apiPost('/pay/paypal/capture', body);
}

export async function createStcPayTransaction(orderPayload) {
  // For future: server route /api/pay/stc/create
  return apiPost('/pay/stc/create', orderPayload);
}

export async function confirmStcPay({ orderId, sessionId, success = true } = {}) {
  return apiPost('/pay/stc/confirm', { orderId, sessionId, success });
}

export async function initBankTransfer({ orderId } = {}) {
  return apiPost('/pay/bank/init', { orderId });
}

export async function confirmBankTransfer({ orderId, reference } = {}) {
  return apiPost('/pay/bank/confirm', { orderId, reference });
}

export async function uploadBankReceipt({ orderId, file }) {
  const fd = new FormData();
  fd.append('orderId', orderId);
  fd.append('receipt', file);
  return apiPostMultipart('/pay/bank/upload', fd);
}

export async function enableCashOnDelivery({ orderId }) {
  return apiPost('/pay/cod/enable', { orderId });
}

export async function createAlRajhiTransaction(orderPayload) {
  // For future: server route /api/pay/alrajhi/create
  return apiPost('/pay/alrajhi/create', orderPayload);
}

export default {
  createPayPalTransaction,
  capturePayPalOrder,
  createStcPayTransaction,
  confirmStcPay,
  initBankTransfer,
  confirmBankTransfer,
  uploadBankReceipt,
  enableCashOnDelivery,
  createAlRajhiTransaction
};