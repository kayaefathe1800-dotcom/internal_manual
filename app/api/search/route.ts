import { NextResponse } from "next/server";
import { searchDocuments } from "../../../lib/search";
import type { PortalCategory } from "../../../types/portal";

export async function POST(request: Request) {
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
