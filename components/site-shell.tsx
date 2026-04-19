import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import type { PortalUser } from "../types/portal";

type Props = {
  children: ReactNode;
  user: PortalUser | null;
};

const navItems = [
  { href: "/", label: "トップ" },
  { href: "/manuals", label: "マニュアル" },
  { href: "/rules", label: "就業規則" },
  { href: "/admin", label: "管理者" }
];

export async function SiteShell({ children, user }: Props) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link is-active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <div className="user-badge">
                <span>{user.name}</span>
                <span className={user.role === "admin" ? "role-pill is-admin" : "role-pill is-employee"}>
                  {user.role === "admin" ? "管理者" : "一般社員"}
                </span>
              </div>
              <Link href="/logout" className="logout-button">
                ログアウト
              </Link>
            </>
          ) : (
            <Link href="/login" className="solid-link">
              社員ログイン
            </Link>
          )}
        </div>
      </header>

      {children}
    </main>
  );
}
