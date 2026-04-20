import { cookies } from "next/headers";
import type { PortalUser, UserRole } from "../types/portal";

const SESSION_COOKIE = "portal-demo-session";

type DemoUser = PortalUser & {
  password: string;
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

export async function getCurrentUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const user = demoUsers.find((candidate) => candidate.id === session);
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      }
    : null;
}

export async function getAdminUser() {
  const user = await getCurrentUser();
  return user?.isAdmin ? user : null;
}

export function authenticateUser(email: string, password: string, role: UserRole) {
  return demoUsers.find(
    (user) => user.email === email.trim().toLowerCase() && user.password === password && user.role === role
  );
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
