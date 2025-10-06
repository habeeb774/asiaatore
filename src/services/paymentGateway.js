// محاكاة بسيطة لبوابة دفع (يمكن استبدالها لاحقاً بـ API حقيقي)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function createPaymentIntent({ amount, currency }) {
  await sleep(400);
  if (!amount) return { success: false, error: 'المبلغ غير صالح' };
  return {
    success: true,
    intent: {
      id: 'pi_' + Date.now(),
      amount,
      currency,
      status: 'created'
    }
  };
}

export async function attachCard(intentId, { cardNumber }) {
  await sleep(500);
  if (!intentId) return { success: false, error: 'لا يوجد معرف intent' };
  if (!cardNumber || cardNumber.replace(/\D/g, '').length < 13) {
    return { success: false, error: 'رقم البطاقة غير صالح' };
  }
  return { success: true, status: 'card_attached' };
}

export async function confirmPayment(intentId) {
  await sleep(800);
  if (!intentId) return { success: false, error: 'لا يوجد معرف intent' };
  // نسبة فشل عشوائية بسيطة
  if (Math.random() < 0.08) {
    return { success: false, error: 'فشل التحقق من البنك' };
  }
  return {
    success: true,
    status: 'succeeded',
    transactionId: 'tx_' + Math.floor(Math.random() * 1e8)
  };
}
