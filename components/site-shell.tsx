import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { PortalUser } from "../types/portal";

type Props = {
  children: ReactNode;
  user: PortalUser | null;
};

export async function SiteShell({ children, user }: Props) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/";

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return (
    <main className="portal-shell">
      <header className="site-header">
        <div className="brand-block">
          <div className="brand-mark">KN</div>
          <div className="brand-copy">
            <strong>社内ナレッジポータル</strong>
            <span>マニュアル・就業規則を横断検索</span>
          </div>
        </div>

        <nav className="top-nav" aria-label="グローバルナビゲーション">
          <Link href="/" className={pathname === "/" ? "nav-link is-active" : "nav-link"}>
            トップ
          </Link>
          <Link href="/manuals" className={pathname === "/manuals" ? "nav-link is-active" : "nav-link"}>
            マニュアル
          </Link>
          <Link href="/rules" className={pathname === "/rules" ? "nav-link is-active" : "nav-link"}>
            就業規則
          </Link>
          {user.isAdmin ? (
            <Link
              href="/upload"
              className={pathname === "/upload" ? "nav-link is-active nav-upload-link" : "nav-link nav-upload-link"}
            >
              資料アップロード
            </Link>
          ) : null}
        </nav>

        <div className="header-actions">
          <div className="user-badge">
            <span>{user.name}</span>
            <span className={user.isAdmin ? "role-pill is-admin" : "role-pill is-employee"}>
              {user.isAdmin ? "管理者" : "一般社員"}
            </span>
          </div>
          <Link href="/logout" className="logout-button">
            ログアウト
          </Link>
        </div>
      </header>

      {children}
    </main>
  );
}
