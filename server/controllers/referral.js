import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOrCreateReferralCode, claimReferral } from '../modules/referral/service.js';
import { claimReferralSchema } from '../modules/referral/validation.js';

const router = Router();

router.get('/code', requireAuth, async (req, res) => {
  const ref = await getOrCreateReferralCode(req.user.id);
  res.json({ ok:true, code: ref.code });
});

router.post('/claim', requireAuth, async (req, res) => {
  try {
    const parsed = claimReferralSchema.parse(req.body || {});
    const result = await claimReferral({ code: parsed.code, userId: req.user.id });
    if (!result.ok) return res.status(400).json(result);
    res.json({ ok:true, referral: result.referral });
  } catch (e) {
    res.status(400).json({ error:'REFERRAL_CLAIM_FAILED', message: e.message });
  }
});

export default router;
