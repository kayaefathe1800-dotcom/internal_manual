import { NextResponse } from "next/server";
import { getUserFromAuthorizationHeader } from "../../../lib/auth";
import { listStoredDocuments, saveUploadedDocument } from "../../../lib/document-storage";

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

export async function GET(request: Request) {
  const adminUser = requireAdmin(request);

  if (adminUser instanceof NextResponse) {
    return adminUser;
  }

  const files = await listStoredDocuments();
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const adminUser = requireAdmin(request);

  if (adminUser instanceof NextResponse) {
    return adminUser;
  }

  const formData = await request.formData();
  const file = formData.get("file");

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const savedFile = await saveUploadedDocument(file.name, buffer);

  return NextResponse.json(savedFile);
}
