import { NextResponse } from "next/server";
import { saveUploadedDocument } from "../../../lib/document-storage";

export async function POST(request: Request) {
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
  const result = await saveUploadedDocument(file.name, buffer);

  return NextResponse.json({
    success: true,
    fileName: result.fileName
  });
}
