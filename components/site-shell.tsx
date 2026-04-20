import type { ReactNode } from "react";
import type { PortalUser } from "../types/portal";
import { ProtectedRoute } from "./protected-route";
import { SiteHeaderClient } from "./site-header-client";

type Props = {
  children: ReactNode;
  user: PortalUser | null;
  requireAdmin?: boolean;
};

export async function SiteShell({ children, user, requireAdmin = false }: Props) {
  return (
    <main className="portal-shell">
      <SiteHeaderClient initialUser={user} />
      <ProtectedRoute requireAdmin={requireAdmin}>{children}</ProtectedRoute>
    </main>
  );
}
