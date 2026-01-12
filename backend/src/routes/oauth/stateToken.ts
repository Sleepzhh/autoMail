import jwt from "jsonwebtoken";

export interface OAuthStatePayload {
  timestamp: number;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "automail-oauth-state-secret";

export function generateStateToken(): string {
  const payload: OAuthStatePayload = { timestamp: Date.now() };
  // State token expires in 10 minutes
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });
}

export function verifyStateToken(token: string): OAuthStatePayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as OAuthStatePayload;
  } catch (error) {
    return null;
  }
}
