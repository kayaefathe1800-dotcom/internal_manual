import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authenticateUser,
  getSessionCookieName,
  getSessionDurationSeconds,
  issueSessionToken
} from "../../../lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const user = authenticateUser(body.email ?? "", body.password ?? "");

  if (!user) {
    return NextResponse.json(
      {
        error: "メールアドレスまたはパスワードが正しくありません。"
      },
      { status: 401 }
    );
  }

  const token = issueSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionDurationSeconds()
  });

  return NextResponse.json({
    user,
    token
  });
}
