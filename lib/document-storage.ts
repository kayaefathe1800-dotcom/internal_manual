import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_DIR_NAME = "社内資料";
const storageDir = path.join(process.cwd(), STORAGE_DIR_NAME);

export type StoredDocument = {
  name: string;
  size: number;
  updatedAt: string;
};

export async function ensureStorageDir() {
  await mkdir(storageDir, { recursive: true });
  return storageDir;
}

export async function listStoredDocuments(): Promise<StoredDocument[]> {
  await ensureStorageDir();
  const names = await readdir(storageDir);

  const files = await Promise.all(
    names.map(async (name) => {
      const target = path.join(storageDir, name);
      const info = await stat(target);

      if (!info.isFile()) {
        return null;
      }

      return {
        name,
        size: info.size,
        updatedAt: info.mtime.toISOString()
      } satisfies StoredDocument;
    })
  );

  return files
    .filter((file): file is StoredDocument => file !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");
}

export async function saveUploadedDocument(fileName: string, buffer: Buffer) {
  await ensureStorageDir();

  const safeName = sanitizeFileName(fileName);
  const stampedName = `${Date.now()}-${safeName}`;
  const target = path.join(storageDir, stampedName);

  await writeFile(target, buffer);

  return {
    fileName: stampedName,
    directory: storageDir
  };
}
