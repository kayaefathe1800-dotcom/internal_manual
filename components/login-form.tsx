"use client";

import Link from "next/link";
import { useState } from "react";
import { storeToken } from "../lib/auth-client";
import type { PortalUser } from "../types/portal";

type Props = {
  redirectTo: string;
};

type LoginResponse = {
  user?: PortalUser;
  token?: string;
  error?: string;
};

export function LoginForm({ redirectTo }: Props) {
  const [email, setEmail] = useState("employee@example.co.jp");
  const [password, setPassword] = useState("employee123");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.error ?? "ログインに失敗しました。");
      }

      storeToken(data.token);
      window.location.href = redirectTo || "/";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "ログインに失敗しました。");
      setPending(false);
    }
  }

  return (
    <>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label" htmlFor="email">
            メールアドレス
          </label>
          <input
            className="text-input"
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="password">
            パスワード
          </label>
          <input
            className="password-input"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="login-actions">
          <button type="submit" className="submit-button" disabled={pending}>
            {pending ? "ログイン中..." : "ログインする"}
          </button>
          <Link href="/" className="ghost-link">
            トップへ戻る
          </Link>
        </div>
      </form>

      {error ? <div className="error-banner">{error}</div> : null}
    </>
  );
}
