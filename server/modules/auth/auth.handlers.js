import { loginSchema, registerSchema } from "./auth.validation.js";
import {
  loginUser, // Ensure loginUser is imported
  registerUser,
  createSession,
  sendVerificationEmail,
  refreshSession,
} from "./auth.service.js";
import { signAccessToken } from "../../utils/jwt.js";
import { cookieOpts } from "../../utils/cookie.js";
import prisma from "../../db/client.js";

const REFRESH_COOKIE = "rt";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export async function registerHandler(req, res) {
  try {
    const parsed = registerSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "MISSING_FIELDS",
        fields: parsed.error.flatten(),
      });
    }
    const { email, password, name, phone } = parsed.data;

    const user = await registerUser(email, password, name, phone);

    // Auto-login user after registration
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const { rawRefresh, ttlMs } = await createSession(user.id, req.headers?.["user-agent"], req.ip);

    // Send verification email without blocking the response
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    sendVerificationEmail(user, baseUrl).catch((err) =>
      req.log.error({ err }, "Failed to send verification email")
    );
    // Set the refresh token cookie
    res.cookie(REFRESH_COOKIE, rawRefresh, { ...cookieOpts(req), maxAge: ttlMs });
    return res.status(201).json({
      ok: true,
      accessToken,
      user: { id: user.id, role: user.role, email: user.email, name: user.name, phone: user.phone },
    });
  } catch (error) {
    const errorMap = {
      EMAIL_EXISTS: { status: 409, error: "EMAIL_EXISTS" },
      PHONE_EXISTS: { status: 409, error: "PHONE_EXISTS" },
    };
    const err = errorMap[error.message] || { status: 500, error: "REGISTER_FAILED" };

    req.log?.error({ err: error }, "Register handler error");
    if (error.code === "P2002") {
      // Prisma unique constraint violation
      return res.status(409).json({ ok: false, error: "EMAIL_EXISTS" });
    }

    return res.status(err.status).json({ ok: false, error: err.error, message: error.message });
  }
}

/**
 * @desc    Authenticate user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export async function loginHandler(req, res) {
  try {
    const parsed = loginSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "MISSING_CREDENTIALS", fields: parsed.error.flatten() });
    }
    const { identifier, password, mfaCode } = parsed.data;

    const user = await loginUser(identifier, password, mfaCode);

    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const { rawRefresh, ttlMs } = await createSession(user.id, req.headers?.["user-agent"], req.ip);

    res.cookie(REFRESH_COOKIE, rawRefresh, { ...cookieOpts(req), maxAge: ttlMs });
    return res.json({
      ok: true,
      accessToken,
      user: { id: user.id, role: user.role, email: user.email, name: user.name },
    });
  } catch (error) {
    const errorMap = {
      USER_NOT_FOUND: { status: 401, error: "USER_NOT_FOUND" },
      WRONG_PASSWORD: { status: 401, error: "WRONG_PASSWORD" },
      MFA_REQUIRED: { status: 401, error: "MFA_REQUIRED" },
      INVALID_MFA_CODE: { status: 401, error: "INVALID_MFA_CODE" },
    };
    const err = errorMap[error.message] || { status: 500, error: "LOGIN_FAILED" };

    req.log?.error({ err: error }, "Login handler error");
    return res.status(err.status).json({ ok: false, error: err.error });
  }
}

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Private (via cookie)
 */
export async function refreshHandler(req, res) {
  const oldRefreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!oldRefreshToken) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  try {
    const { accessToken, rawRefresh, ttlMs } = await refreshSession(oldRefreshToken);
    res.cookie(REFRESH_COOKIE, rawRefresh, { ...cookieOpts(req), maxAge: ttlMs });
    return res.json({ ok: true, accessToken });
  } catch (e) {
    req.log?.warn({ err: e }, "Refresh handler error");
    // Clear the invalid/expired refresh token cookie
    res.clearCookie(REFRESH_COOKIE, cookieOpts(req));
    return res.status(401).json({ ok: false, error: "SESSION_EXPIRED" });
  }
}

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export async function meHandler(req, res) {
  // req.user is attached by requireAuth middleware
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile', error: error.message });
  }
}