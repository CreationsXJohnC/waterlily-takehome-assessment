import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const TOKEN_NAME = "token";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type AuthPayload = { userId: number };

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string | undefined): AuthPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function getAuthPayload() {
  const token = cookies().get(TOKEN_NAME)?.value;
  return verifyToken(token);
}

export function setAuthCookie(payload: AuthPayload) {
  const token = signToken(payload);
  cookies().set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie() {
  cookies().set({ name: TOKEN_NAME, value: "", path: "/", maxAge: 0 });
}