import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../lib/auth";
import { listStoredDocuments, saveUploadedDocument } from "../../../lib/document-storage";
import type { PortalCategory } from "../../../types/portal";

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

function internalErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "資料処理中にエラーが発生しました。";
  return NextResponse.json(
    {
      error: message
    },
    { status: 500 }
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

export async function GET(request: Request) {
  try {
    const adminUser = requireAdmin(request);

    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const files = await listStoredDocuments();
    return NextResponse.json({ files });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = requireAdmin(request);

    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const categoryValue = String(formData.get("category") ?? "");
    const category: PortalCategory | null = categoryValue === "manual" || categoryValue === "rule" ? categoryValue : null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "アップロードするファイルを選択してください。"
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "空のファイルは保存できません。"
        },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error: "カテゴリーを選択してください。"
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const savedFile = await saveUploadedDocument(file.name, category, buffer);
    revalidatePath("/manuals");
    revalidatePath("/rules");
    revalidatePath("/upload");

    return NextResponse.json(savedFile);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
