import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/auth";
import { getStoredDocument } from "../../../../../lib/document-storage";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function forbiddenResponse() {
  return NextResponse.json(
    {
      error: "管理者のみ操作できます。"
    },
    { status: 403 }
  );
}

export async function GET(_: Request, { params }: Props) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return forbiddenResponse();
  }

  const { id } = await params;
  const storedDocument = await getStoredDocument(id);

  if (!storedDocument) {
    return NextResponse.json(
      {
        error: "対象の資料が見つかりません。"
      },
      { status: 404 }
    );
  }

  return new NextResponse(storedDocument.buffer, {
    status: 200,
    headers: {
      "Content-Type": storedDocument.contentType,
      "Content-Length": String(storedDocument.size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(storedDocument.record.fileName)}"`,
      "Cache-Control": "no-store"
    }
  });
}
