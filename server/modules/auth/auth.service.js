import prisma from "../../db/client.js";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  randomToken,
  verifyToken,
  sha256,
} from "../../utils/jwt.js";
import { sendEmail } from "../../utils/email.js";
import speakeasy from "speakeasy";

const HAS_PRISMA_SESSION =
  !!prisma.session && typeof prisma.session.create === "function";
const HAS_PRISMA_AUTHTOKEN =
  !!prisma.authToken && typeof prisma.authToken.create === "function";

// Multi-identifier login (email OR phone). If password omitted for social, caller must pass socialProvider/signed token.
export async function loginUser(identifier, password, mfaCode, options = {}) {
  const trimmed = identifier.trim();
  const isEmail = /@/.test(trimmed);
  const where = isEmail
    ? { email: trimmed.toLowerCase() }
    : { phone: trimmed };
  let user = await prisma.user.findFirst({ where });

  // Fallback: allow login by social provider id if configured
  if (!user && options?.socialProvider && options?.socialProviderId) {
    user = await prisma.user.findFirst({
      where: {
        socialProvider: options.socialProvider,
        socialProviderId: options.socialProviderId,
      },
    });
  }
  if (!user) throw new Error("USER_NOT_FOUND");

  // Social auth may bypass password if validated upstream
  if (!options?.socialLogin) {
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("WRONG_PASSWORD");
  }

  if (user.mfaEnabled) {
    if (!mfaCode) {
      throw new Error("MFA_REQUIRED");
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: mfaCode,
    });
    if (!verified) {
      throw new Error("INVALID_MFA_CODE");
    }
  }

  return user;
}

export async function registerUser(email, password, name, phone, social) {
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new Error("EMAIL_EXISTS");
  }
  if (phone) {
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) throw new Error("PHONE_EXISTS");
  }
  if (social?.provider && social?.providerId) {
    const existingSocial = await prisma.user.findFirst({
      where: {
        socialProvider: social.provider,
        socialProviderId: social.providerId,
      },
    });
    if (existingSocial) throw new Error("SOCIAL_EXISTS");
  }
  const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash(randomToken(16), 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role: "user",
      socialProvider: social?.provider,
      socialProviderId: social?.providerId,
    },
  });
  return user;
}

export async function createSession(userId, userAgent, ip) {
  const rawRefresh = randomToken(48);
  const tokenHash = sha256(rawRefresh);
  const ttlMs = Number(
    process.env.REFRESH_TOKEN_TTL_MS || 1000 * 60 * 60 * 24 * 30
  );
  const expiresAt = new Date(Date.now() + ttlMs);

  if (HAS_PRISMA_SESSION) {
    await prisma.session.create({
      data: { userId, refreshHash: tokenHash, userAgent, ip, expiresAt },
    });
  }

  return { rawRefresh, ttlMs };
}

export async function sendVerificationEmail(user, baseUrl) {
  if (!user.email) return;

  const emailToken = randomToken(24);
  const emailHash = sha256(emailToken);
  const emailExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  if (HAS_PRISMA_AUTHTOKEN) { // Only create if AuthToken model exists
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: "email_verify",
        tokenHash: emailHash,
        expiresAt: emailExpiresAt,
      },
    });
  }

  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(
    emailToken
  )}&email=${encodeURIComponent(user.email)}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: `Verify: ${verifyUrl}`,
  });
}

export async function refreshSession(oldRefreshToken) {
  const oldTokenHash = sha256(oldRefreshToken);

  // For stateless JWTs, we just verify and re-issue.
  // For stateful sessions, we'd look up the session in the DB.
  if (!HAS_PRISMA_SESSION) {
    const payload = verifyToken(oldRefreshToken); // Verify the old refresh token
    if (!payload) throw new Error("INVALID_REFRESH_TOKEN");
    const accessToken = signAccessToken({ id: payload.id, role: payload.role });
    const { rawRefresh, ttlMs } = await createSession(payload.id); // Create a new session
    return { accessToken, rawRefresh, ttlMs };
  }

  const session = await prisma.session.findUnique({
    where: { refreshHash: oldTokenHash },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    throw new Error("SESSION_EXPIRED");
  } // Session is valid, create a new one and delete the old one
  const { rawRefresh, ttlMs } = await createSession(session.userId); // Create a new session
  const accessToken = signAccessToken({ id: session.userId }); // Sign a new access token
  await prisma.session.delete({ where: { id: session.id } }); // Delete the old session
  return { accessToken, rawRefresh, ttlMs }; // Return new tokens and TTL
}
