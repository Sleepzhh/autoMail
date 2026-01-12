import jwt from "jsonwebtoken";

// JWT-based state token utilities
export interface OAuthStatePayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export function generateStateToken(userId: string): string {
  const payload: OAuthStatePayload = { userId };
  // State token expires in 10 minutes
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "10m" });
}

export function verifyStateToken(token: string): OAuthStatePayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as OAuthStatePayload;
  } catch (error) {
    return null;
  }
}
