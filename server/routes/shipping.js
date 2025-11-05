import express from 'express';
import { quoteShipping } from '../utils/shipping.js';

// Shipping routes: expose a simple quote endpoint using pure utils (no DB required)
const router = express.Router();

// POST /api/shipping/quote { address: { city?: string } , origin?: { lat, lng }, config?: {...} }
router.post('/quote', (req, res) => {
  try {
    const address = req.body?.address || req.body || {};
    const cfg = req.body?.config || {};
    const q = quoteShipping(address, cfg);
    return res.json({ ok: true, quote: q });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'QUOTE_FAILED', message: e.message });
  }
});

export default router;
