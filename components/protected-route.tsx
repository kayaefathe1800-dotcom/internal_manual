"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (requireAdmin && !user.isAdmin) {
      router.replace("/login?redirect=%2Fupload");
    }
  }, [loading, pathname, requireAdmin, router, user]);

  if (loading || !user || (requireAdmin && !user.isAdmin)) {
    return (
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">認証確認中</p>
            <h1>ログイン状態を確認しています</h1>
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
