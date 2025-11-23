// Helper to set/clear refresh cookie
export function cookieOpts(req) {
  if (!req) { // Provide a default if req is not available (e.g., in tests)
    // Return default options if req is undefined
    const env = process.env.NODE_ENV || "development";
    return {
      httpOnly: true,
      secure: env === "production",
      sameSite: process.env.COOKIE_SAMESITE || "lax",
      path: "/",
    };
  }
  const env = process.env.NODE_ENV || "development";
  const wantNone =
    process.env.CROSS_SITE_COOKIES === "true" ||
    (process.env.COOKIE_SAMESITE || "").toLowerCase() === "none";
  // Detect HTTPS behind proxy
  const xfProto = (req.headers?.["x-forwarded-proto"] || "")
    .toString()
    .toLowerCase();
  const isHttps = req.secure || xfProto === "https";
  const secure = env === "production" ? true : isHttps;
  const sameSite = process.env.COOKIE_SAMESITE || (wantNone ? "none" : "lax");
  // When SameSite=None, browsers require Secure
  const finalSecure = sameSite.toLowerCase() === "none" ? true : secure;
  return {
    httpOnly: true,
    secure: finalSecure,
    sameSite,
    path: "/",
  };
}
