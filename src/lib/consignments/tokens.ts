import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export interface DistributorToken { sid: string; csrf: string; exp: number }
export const sessionHash = (sid: string) => createHash("sha256").update(sid).digest("hex");
export function signToken(secret: string): { token: string; payload: DistributorToken } {
  if (secret.length < 32) throw new Error("SESSION_NOT_CONFIGURED");
  const payload = { sid: randomBytes(32).toString("base64url"), csrf: randomBytes(32).toString("base64url"), exp: Math.floor(Date.now() / 1000) + 8 * 3600 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { payload, token: `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}` };
}
export function verifyToken(token: string, secret: string): DistributorToken | null {
  try {
    if (secret.length < 32 || token.length > 1000) return null;
    const [body, signature, extra] = token.split(".");
    if (!body || !signature || extra) return null;
    const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("base64url"));
    const actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) return null;
    const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!/^[A-Za-z0-9_-]{43}$/.test(value.sid) || !/^[A-Za-z0-9_-]{43}$/.test(value.csrf) || !Number.isInteger(value.exp) || value.exp <= Date.now() / 1000) return null;
    return value;
  } catch { return null; }
}
