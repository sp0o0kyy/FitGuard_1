import * as crypto from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { getDb } from "./db";
import { sessionTokens, users, type User } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getUserByOpenId } from "./db";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";

const AUTH_COOKIE = "fp_session";
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

// ---------- Password hashing ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, expected] = stored.split(":");
    if (!salt || !expected) return false;
    const computed = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ---------- Session token management ----------
export async function createSession(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionTokens).values({ userId, token, expiresAt });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessionTokens).where(eq(sessionTokens.token, token));
}

export async function getUserFromSessionToken(token: string): Promise<User | null> {
  const db = await getDb();
  if (!db || !token) return null;
  const rows = await db
    .select()
    .from(sessionTokens)
    .where(eq(sessionTokens.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessionTokens).where(eq(sessionTokens.id, row.id));
    return null;
  }
  const userRows = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  return userRows[0] ?? null;
}

// ---------- Cookie helpers ----------
export function setAuthCookie(req: Request, res: Response, token: string): void {
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isHttps || !req.hostname.includes("localhost"),
    sameSite: isHttps || !req.hostname.includes("localhost") ? "none" : "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearAuthCookie(req: Request, res: Response): void {
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: isHttps || !req.hostname.includes("localhost"),
    sameSite: isHttps || !req.hostname.includes("localhost") ? "none" : "lax",
    path: "/",
  });
}

export function extractAuthToken(req: Request): string | null {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  if (cookies[AUTH_COOKIE]) return cookies[AUTH_COOKIE];
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

// ---------- Universal user resolution (fp_session + Manus OAuth) ----------
export async function resolveAuthUser(req: Request): Promise<User | null> {
  // 1. Built-in session token (cookie fp_session or Bearer token)
  const token = extractAuthToken(req);
  if (token) {
    const user = await getUserFromSessionToken(token);
    if (user) return user;
  }

  // 2. Optional Manus OAuth cookie compatibility (for Preview auto-login)
  try {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const sessionCookie = cookies[COOKIE_NAME];
    if (sessionCookie) {
      const payload = await sdk.verifySession(sessionCookie);
      if (payload && payload.openId) {
        const u = await getUserByOpenId(payload.openId);
        if (u) return u;
      }
    }
  } catch {
    // ignore
  }

  return null;
}
