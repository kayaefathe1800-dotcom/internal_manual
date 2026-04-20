import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PortalCategory, StoredFileRecord } from "../types/portal";

const STORAGE_DIR_NAME = "社内資料";
const MANIFEST_FILE_NAME = "manifest.json";

function getStorageDir() {
  const baseDir = process.env.VERCEL ? "/tmp" : process.cwd();
  return path.join(baseDir, STORAGE_DIR_NAME);
}

function getManifestPath() {
  return path.join(getStorageDir(), MANIFEST_FILE_NAME);
}

async function ensureStorageDir() {
  const storageDir = getStorageDir();
  await mkdir(storageDir, { recursive: true });
  return storageDir;
}

async function readManifest(): Promise<StoredFileRecord[]> {
  await ensureStorageDir();

  try {
    const manifest = await readFile(getManifestPath(), "utf8");
    const parsed = JSON.parse(manifest) as Array<StoredFileRecord | (Omit<StoredFileRecord, "category"> & { category?: PortalCategory })>;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((record) => ({
      ...record,
      category: record.category === "rule" ? "rule" : "manual"
    }));
  } catch {
    return [];
  }
}

async function writeManifest(records: StoredFileRecord[]) {
  await ensureStorageDir();
  await writeFile(getManifestPath(), JSON.stringify(records, null, 2), "utf8");
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");
}

function getContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "application/octet-stream";
  }
}

export async function listStoredDocuments(category?: PortalCategory): Promise<StoredFileRecord[]> {
  const records = await readManifest();
  const filteredRecords = category ? records.filter((record) => record.category === category) : records;
  return filteredRecords.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function saveUploadedDocument(
  fileName: string,
  category: PortalCategory,
  buffer: Buffer
): Promise<StoredFileRecord> {
  const storageDir = await ensureStorageDir();
  const manifest = await readManifest();
  const safeName = sanitizeFileName(fileName);
  const id = randomUUID();
  const storedName = `${id}-${safeName}`;
  const filePath = path.join(storageDir, storedName);

  await writeFile(filePath, buffer);

  const record: StoredFileRecord = {
    id,
    fileName: safeName,
    category,
    url: `/api/files/${id}/download`,
    createdAt: new Date().toISOString()
  };

  await writeManifest([record, ...manifest]);
  return record;
}

export async function deleteStoredDocument(id: string) {
  const storageDir = await ensureStorageDir();
  const manifest = await readManifest();
  const targetRecord = manifest.find((record) => record.id === id);

  if (!targetRecord) {
    return null;
  }

  const fileNames = await readdir(storageDir);
  const matchedFile = fileNames.find((name) => name.startsWith(`${id}-`));

  if (matchedFile) {
    await unlink(path.join(storageDir, matchedFile)).catch(() => undefined);
  }

  await writeManifest(manifest.filter((record) => record.id !== id));
  return targetRecord;
}

export async function getStoredDocument(id: string) {
  const storageDir = await ensureStorageDir();
  const manifest = await readManifest();
  const targetRecord = manifest.find((record) => record.id === id);

  if (!targetRecord) {
    return null;
  }

  const fileNames = await readdir(storageDir);
  const matchedFile = fileNames.find((name) => name.startsWith(`${id}-`));

  if (!matchedFile) {
    return null;
  }

  const filePath = path.join(storageDir, matchedFile);
  const fileInfo = await stat(filePath);
  const buffer = await readFile(filePath);

  return {
    record: targetRecord,
    buffer,
    contentType: getContentType(targetRecord.fileName),
    size: fileInfo.size
  };
}
