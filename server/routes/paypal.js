import express from 'express';

const router = express.Router();

// PayPal sandbox config from env
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_BASE = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error('Failed to get PayPal token');
  const data = await res.json();
  return data.access_token;
}

// Create an order and return approval URL
router.post('/create-order', async (req, res) => {
  try {
    const { total = '0.00', currency = 'SAR', items = [] } = req.body || {};
    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: currency, value: String(total) } }],
        application_context: { return_url: process.env.PAYPAL_RETURN_URL || 'http://localhost:5173/checkout/success', cancel_url: process.env.PAYPAL_CANCEL_URL || 'http://localhost:5173/checkout/cancel' }
      })
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      return res.status(500).json({ error: 'paypal_create_failed', detail: text });
    }

    const orderData = await orderRes.json();
    // find approval link
    const approval = orderData.links && orderData.links.find(l => l.rel === 'approve');
    return res.json({ approvalUrl: approval ? approval.href : null, order: orderData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// Capture order (client-side should call after approval)
router.post('/capture/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!captureRes.ok) {
      const text = await captureRes.text();
      return res.status(500).json({ error: 'paypal_capture_failed', detail: text });
    }

    const data = await captureRes.json();
    return res.json({ captured: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

export default router;
