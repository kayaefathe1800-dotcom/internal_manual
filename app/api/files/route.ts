import { NextResponse } from "next/server";
import { getAdminUser } from "../../../lib/auth";
import { listStoredDocuments, saveUploadedDocument } from "../../../lib/document-storage";

function forbiddenResponse() {
  return NextResponse.json(
    {
      error: "管理者のみ操作できます。"
    },
    { status: 403 }
  );
}

export async function GET() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return forbiddenResponse();
  }

  const files = await listStoredDocuments();
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return forbiddenResponse();
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
