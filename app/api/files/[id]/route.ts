import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/auth";
import { deleteStoredDocument } from "../../../../lib/document-storage";

function forbiddenResponse() {
  return NextResponse.json(
    {
      error: "管理者のみ操作できます。"
    },
    { status: 403 }
  );
}

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_: Request, { params }: Props) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return forbiddenResponse();
  }

  const { id } = await params;
  const deleted = await deleteStoredDocument(id);

  if (!deleted) {
    return NextResponse.json(
      {
        error: "対象の資料が見つかりません。"
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true
  });
}
