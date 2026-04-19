import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../lib/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(getSessionCookieName());
  return response;
}
