import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}
