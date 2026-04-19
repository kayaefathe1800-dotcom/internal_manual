"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "../app/login/actions";

type Props = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <>
      <form className="form-grid" action={formAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="field-group">
          <label className="field-label" htmlFor="email">
            メールアドレス
          </label>
          <input
            className="text-input"
            id="email"
            name="email"
            type="email"
            defaultValue="employee@example.co.jp"
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
            defaultValue="employee123"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="role">
            権限
          </label>
          <select className="select-input" id="role" name="role" defaultValue="employee">
            <option value="employee">一般社員</option>
            <option value="admin">管理者</option>
          </select>
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

      {state?.error ? <div className="error-banner">{state.error}</div> : null}
    </>
  );
}
