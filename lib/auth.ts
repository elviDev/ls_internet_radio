import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET as string;
const secret = new TextEncoder().encode(JWT_SECRET);
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

// Convert expiry string to seconds
function parseExpiry(exp: string): string {
  if (exp.endsWith('d')) {
    return `${parseInt(exp) * 24 * 60 * 60}s`;
  }
  return exp;
}

export async function signToken(payload: object): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(parseExpiry(expiresIn))
    .sign(secret);
}

export async function verifyToken<T = any>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, secret);
  return payload as T;
}
