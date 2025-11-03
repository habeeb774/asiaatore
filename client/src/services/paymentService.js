import { apiPost, apiPostMultipart, apiPostWithHeaders } from './apiService';

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

  // Include client-generated idempotency key so retries are safe end-to-end
  const idem = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  return apiPostWithHeaders('/pay/paypal/create-order', body, { 'x-idempotency-key': idem });
}

export async function capturePayPalOrder({ paypalOrderId, localOrderId } = {}) {
  // prefer sending both; server will accept either param or body
  const body = { paypalOrderId, localOrderId };
  const idem = `cap-${localOrderId || 'x'}-${Date.now().toString(36)}`;
  return apiPostWithHeaders('/pay/paypal/capture', body, { 'x-idempotency-key': idem });
}

export async function createStcPayTransaction(orderPayload) {
  // For future: server route /api/pay/stc/create
  const idem = `stc-c-${(orderPayload?.orderId||'x').slice?.(0,6)||'x'}-${Date.now().toString(36)}`;
  return apiPostWithHeaders('/pay/stc/create', orderPayload, { 'x-idempotency-key': idem });
}

export async function confirmStcPay({ orderId, sessionId, success = true } = {}) {
  const idem = `stc-k-${(orderId||'x').slice?.(0,6)||'x'}-${Date.now().toString(36)}`;
  return apiPostWithHeaders('/pay/stc/confirm', { orderId, sessionId, success }, { 'x-idempotency-key': idem });
}

export async function initBankTransfer({ orderId } = {}) {
  const idem = `bank-i-${(orderId||'x').slice?.(0,6)||'x'}-${Date.now().toString(36)}`;
  return apiPostWithHeaders('/pay/bank/init', { orderId }, { 'x-idempotency-key': idem });
}

export async function confirmBankTransfer({ orderId, reference } = {}) {
  const idem = `bank-c-${(orderId||'x').slice?.(0,6)||'x'}-${Date.now().toString(36)}`;
  return apiPostWithHeaders('/pay/bank/confirm', { orderId, reference }, { 'x-idempotency-key': idem });
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