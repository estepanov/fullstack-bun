import { getRequestIp } from "auth-email-security";
import type { Context } from "hono";

/**
 * Extracts the client IP address from a Hono context
 *
 * Uses auth-email-security's getRequestIp which handles:
 * - X-Forwarded-For header
 * - CF-Connecting-IP header (Cloudflare)
 * - Private IP filtering
 * - Direct connection IP fallback
 *
 * @param c - Hono context object
 * @returns Client IP address or "unknown" if unable to determine
 */
export const extractClientIp = (c: Context): string => {
  const ip = getRequestIp(c.req.raw);
  return ip || "unknown";
};
