import { NextResponse } from "next/server";
import { getUserFromAuthorizationHeader } from "../../../lib/auth";
import { searchDocuments } from "../../../lib/search";
import type { PortalCategory } from "../../../types/portal";

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "認証が必要です。"
    },
    { status: 401 }
  );
}

export async function POST(request: Request) {
  const session = getUserFromAuthorizationHeader(request);

  if (!session) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as {
    query?: string;
    category?: PortalCategory | "all";
  };

  const query = body.query?.trim() ?? "";
  const category = body.category === "manual" || body.category === "rule" ? body.category : undefined;
  const results = searchDocuments(query, category);

  return NextResponse.json({
    query,
    total: results.length,
    results
  });
}
