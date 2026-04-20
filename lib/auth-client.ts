"use client";

import type { PortalUser } from "../types/portal";

const SESSION_STORAGE_KEY = "portal-access-token";

type SessionResponse = {
  user?: PortalUser;
  token?: string;
  expiresAt?: string;
  error?: string;
};

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function storeToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function fetchSession() {
  const response = await fetch("/api/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  if (response.status === 401) {
    clearStoredToken();
    return null;
  }

  const data = (await response.json()) as SessionResponse;

  if (!response.ok || !data.user || !data.token) {
    throw new Error(data.error ?? "ログイン状態の確認に失敗しました。");
  }

  storeToken(data.token);
  return data;
}

async function refreshSessionToken() {
  const session = await fetchSession();
  return session?.token ?? null;
}

export async function ensureSessionToken() {
  const storedToken = getStoredToken();

  if (storedToken) {
    return storedToken;
  }

  const session = await fetchSession();
  return session?.token ?? null;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  async function runRequest(tokenOverride?: string | null) {
    const token = tokenOverride ?? (await ensureSessionToken());
    const headers = new Headers(init.headers ?? {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: "same-origin"
    });
  }

  let response = await runRequest();

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshSessionToken();

  if (refreshedToken) {
    response = await runRequest(refreshedToken);

    if (response.status !== 401) {
      return response;
    }
  }

  clearStoredToken();

  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = `/login?redirect=${redirect}`;
  }

  return response;
}

export async function loadCurrentSession() {
  try {
    return await fetchSession();
  } catch {
    return null;
  }
}
