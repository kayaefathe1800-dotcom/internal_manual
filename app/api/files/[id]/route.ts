import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserFromRequest } from "../../../../lib/auth";
import { deleteStoredDocument } from "../../../../lib/document-storage";

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
  const session = getUserFromRequest(request);

  if (!session) {
    return unauthorizedResponse();
  }

  if (!session.user.isAdmin) {
    return forbiddenResponse();
  }

  return session.user;
}

export async function DELETE(request: Request, { params }: Props) {
  const adminUser = requireAdmin(request);

  if (adminUser instanceof NextResponse) {
    return adminUser;
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

  revalidatePath("/manuals");
  revalidatePath("/rules");
  revalidatePath("/upload");

  return NextResponse.json({
    success: true
  });
}
