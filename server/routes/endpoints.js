import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  const app = req.app;
  const routes = app._router.stack
    .filter(r => r.route)
    .map(r => {
      return {
        path: r.route.path,
        methods: Object.keys(r.route.methods).filter(m => m !== '_all'),
      };
    });

  res.json(routes);
});

export default router;
