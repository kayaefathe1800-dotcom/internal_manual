import { NextResponse } from "next/server";
import { getUserFromAuthorizationHeader } from "../../../../../lib/auth";
import { getStoredDocument } from "../../../../../lib/document-storage";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "認証が必要です。"
    },
    { status: 401 }
  );
}

function forbiddenResponse() {
  return NextResponse.json(
    {
      error: "管理者のみ操作できます。"
    },
    { status: 403 }
  );
}

function requireAdmin(request: Request) {
  const session = getUserFromAuthorizationHeader(request);

  if (!session) {
    return unauthorizedResponse();
  }

  if (!session.user.isAdmin) {
    return forbiddenResponse();
  }

  return session.user;
}

export async function GET(request: Request, { params }: Props) {
  const adminUser = requireAdmin(request);

  if (adminUser instanceof NextResponse) {
    return adminUser;
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
