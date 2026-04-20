import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { PortalUser } from "../types/portal";

const SESSION_COOKIE = "portal-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const SESSION_SECRET = process.env.PORTAL_SESSION_SECRET ?? "internal-manual-demo-secret";

type DemoUser = PortalUser & {
  password: string;
};

type SessionPayload = {
  sub: string;
  exp: number;
};

export const demoUsers: DemoUser[] = [
  {
    id: "u-admin",
    name: "管理者 佐藤",
    email: "admin@example.co.jp",
    role: "admin",
    isAdmin: true,
    password: "admin123"
  },
  {
    id: "u-employee",
    name: "一般社員 田中",
    email: "employee@example.co.jp",
    role: "employee",
    isAdmin: false,
    password: "employee123"
  }
];

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

function signPayload(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function buildUser(user: DemoUser): PortalUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin
  };
}

function findUserById(userId: string) {
  return demoUsers.find((candidate) => candidate.id === userId) ?? null;
}

export function issueSessionToken(user: PortalUser) {
  const payload = encodePayload({
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  });

  return `${payload}.${signPayload(payload)}`;
}

export function verifySessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [payloadValue, signatureValue] = token.split(".");

  if (!payloadValue || !signatureValue) {
    return null;
  }

  const expectedSignature = signPayload(payloadValue);
  const providedSignature = Buffer.from(signatureValue);
  const computedSignature = Buffer.from(expectedSignature);

  if (providedSignature.length !== computedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(providedSignature, computedSignature)) {
    return null;
  }

  const payload = decodePayload(payloadValue);

  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const user = findUserById(payload.sub);
  return user ? buildUser(user) : null;
}

export function getSessionExpiresAt(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const [payloadValue] = token.split(".");
  const payload = payloadValue ? decodePayload(payloadValue) : null;

  return payload ? new Date(payload.exp * 1000).toISOString() : null;
}

export async function getCurrentUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function getSessionTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getAdminUser() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

export function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = demoUsers.find((candidate) => candidate.email === normalizedEmail && candidate.password === password);
  return user ? buildUser(user) : null;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionDurationSeconds() {
  return SESSION_DURATION_SECONDS;
}

export function getUserFromAuthorizationHeader(request: Request | NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const user = verifySessionToken(token);

  return user ? { token, user } : null;
}
