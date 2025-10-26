import express from 'express';

// Minimal Express server for quick tests and demos
const app = express();
const PORT = Number(process.env.PORT) || 5050;

// Parse JSON bodies
app.use(express.json());

// Health endpoint
app.get('/_health', (_req, res) => {
  res.json({ ok: true, status: 'up', time: new Date().toISOString() });
});

// Hello endpoint
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Simple Express server is running 🎯' });
});

// Echo endpoint
app.post('/echo', (req, res) => {
  res.json({ ok: true, youSent: req.body || null });
});

app.listen(PORT, () => {
   
  console.log(`[simple] listening on http://localhost:${PORT}`);
});
