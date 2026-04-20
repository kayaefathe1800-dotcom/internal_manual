"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalUser } from "../types/portal";
import { useAuth } from "./auth-provider";
import { UploadNavButton } from "./upload-nav-button";

type Props = {
  initialUser: PortalUser | null;
};

export function SiteHeaderClient({ initialUser }: Props) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const currentUser = user ?? initialUser;

  return (
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
        <UploadNavButton isActive={pathname === "/upload"} initialIsAdmin={Boolean(currentUser?.isAdmin)} />
      </nav>

      <div className="header-actions">
        {currentUser ? (
          <>
            <div className="user-badge">
              <span>{currentUser.name}</span>
              <span className={currentUser.isAdmin ? "role-pill is-admin" : "role-pill is-employee"}>
                {currentUser.isAdmin ? "管理者" : "一般社員"}
              </span>
            </div>
            <Link href="/logout" className="logout-button">
              ログアウト
            </Link>
          </>
        ) : loading ? null : (
          <Link href="/login" className="solid-link">
            社員ログイン
          </Link>
        )}
      </div>
    </header>
  );
}
