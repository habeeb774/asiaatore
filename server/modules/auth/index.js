import { Router } from "express";
import { loginHandler, registerHandler, meHandler, refreshHandler } from "./auth.handlers.js";
import { requireAuth } from "../../middleware/auth.js"; // Ensure requireAuth is imported

const router = Router();

router.post("/login", loginHandler);
router.post("/register", registerHandler);
router.post("/refresh", refreshHandler);
router.get("/me", requireAuth, meHandler);

export default router;
