"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateUser, getSessionCookieName } from "../../lib/auth";
import type { UserRole } from "../../types/portal";

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "employee") as UserRole;
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  const user = authenticateUser(email, password, role);

  if (!user) {
    return {
      error: "メールアドレス、パスワード、権限の組み合わせが正しくありません。"
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  redirect(redirectTo || "/");
}
