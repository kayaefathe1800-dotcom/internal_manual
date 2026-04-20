import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCurrentUser,
  getSessionCookieName,
  getSessionExpiresAt,
  getSessionTokenFromCookies
} from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const token = await getSessionTokenFromCookies();

  if (!user || !token) {
    const cookieStore = await cookies();
    cookieStore.delete(getSessionCookieName());

    return NextResponse.json(
      {
        error: "認証が必要です。"
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user,
    token,
    expiresAt: getSessionExpiresAt(token)
  });
}
