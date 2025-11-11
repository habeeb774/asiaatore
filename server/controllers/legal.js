import express from 'express';

// Minimal legal routes placeholder.
// Provides basic endpoints for terms and privacy so server/index.js imports don't fail.
const router = express.Router();

router.get('/terms', (_req, res) => {
  res.type('text/plain').send('Terms and Conditions will be provided by the site owner.');
});

router.get('/privacy', (_req, res) => {
  res.type('text/plain').send('Privacy Policy will be provided by the site owner.');
});

export default router;
