import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PortalCategory, StoredFileRecord } from "../types/portal";

const STORAGE_DIR_NAME = "社内資料";
const MANIFEST_FILE_NAME = "manifest.json";
const DEFAULT_BUCKET = "internal-documents";

type StorageObjectEntry = {
  name: string;
  created_at?: string;
  updated_at?: string;
};

function getStorageDir() {
  return path.join(process.cwd(), STORAGE_DIR_NAME);
}

function getManifestPath() {
  return path.join(getStorageDir(), MANIFEST_FILE_NAME);
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
    bucket
  };
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");
}

function encodeStoragePath(value: string) {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
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

function buildStoredRecord(category: PortalCategory, objectName: string, createdAt?: string): StoredFileRecord {
  const safeName = sanitizeFileName(objectName);
  const hyphenIndex = safeName.indexOf("-");
  const id = hyphenIndex > 0 ? safeName.slice(0, hyphenIndex) : safeName;
  const fileName = hyphenIndex > 0 ? safeName.slice(hyphenIndex + 1) : safeName;

  return {
    id,
    fileName,
    category,
    url: `/api/files/${id}/download`,
    createdAt: createdAt ?? new Date().toISOString()
  };
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

async function listLocalDocuments(category?: PortalCategory): Promise<StoredFileRecord[]> {
  const records = await readManifest();
  const filteredRecords = category ? records.filter((record) => record.category === category) : records;
  return filteredRecords.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function saveLocalDocument(fileName: string, category: PortalCategory, buffer: Buffer): Promise<StoredFileRecord> {
  const storageDir = await ensureStorageDir();
  const manifest = await readManifest();
  const safeName = sanitizeFileName(fileName);
  const id = randomUUID();
  const categoryDir = path.join(storageDir, category);
  await mkdir(categoryDir, { recursive: true });
  const storedName = `${id}-${safeName}`;
  const filePath = path.join(categoryDir, storedName);

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

async function deleteLocalDocument(id: string) {
  const storageDir = await ensureStorageDir();
  const manifest = await readManifest();
  const targetRecord = manifest.find((record) => record.id === id);

  if (!targetRecord) {
    return null;
  }

  const categoryDir = path.join(storageDir, targetRecord.category);
  const fileNames = await readdir(categoryDir).catch(() => [] as string[]);
  const matchedFile = fileNames.find((name) => name.startsWith(`${id}-`));

  if (matchedFile) {
    await unlink(path.join(categoryDir, matchedFile)).catch(() => undefined);
  }

  await writeManifest(manifest.filter((record) => record.id !== id));
  return targetRecord;
}

async function getLocalDocument(id: string) {
  const storageDir = await ensureStorageDir();
  const manifest = await readManifest();
  const targetRecord = manifest.find((record) => record.id === id);

  if (!targetRecord) {
    return null;
  }

  const categoryDir = path.join(storageDir, targetRecord.category);
  const fileNames = await readdir(categoryDir).catch(() => [] as string[]);
  const matchedFile = fileNames.find((name) => name.startsWith(`${id}-`));

  if (!matchedFile) {
    return null;
  }

  const filePath = path.join(categoryDir, matchedFile);
  const fileInfo = await stat(filePath);
  const buffer = await readFile(filePath);

  return {
    record: targetRecord,
    buffer,
    contentType: getContentType(targetRecord.fileName),
    size: fileInfo.size
  };
}

async function supabaseRequest(input: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase storage is not configured.");
  }

  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  headers.set("apikey", config.serviceRoleKey);

  return fetch(`${config.url}${input}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

async function listSupabaseFolder(category: PortalCategory) {
  const config = getSupabaseConfig();

  if (!config) {
    return [];
  }

  const response = await supabaseRequest(`/storage/v1/object/list/${config.bucket}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prefix: category,
      limit: 100,
      offset: 0,
      sortBy: {
        column: "created_at",
        order: "desc"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to list Supabase storage objects: ${response.status}`);
  }

  const data = (await response.json()) as StorageObjectEntry[];
  return data
    .filter((entry) => entry.name && !entry.name.endsWith("/"))
    .map((entry) => ({
      record: buildStoredRecord(category, entry.name, entry.created_at ?? entry.updated_at),
      objectPath: `${category}/${entry.name}`
    }));
}

async function findSupabaseObject(id: string) {
  const categories: PortalCategory[] = ["manual", "rule"];

  for (const category of categories) {
    const entries = await listSupabaseFolder(category);
    const matched = entries.find((entry) => entry.record.id === id);

    if (matched) {
      return matched;
    }
  }

  return null;
}

async function listSupabaseDocuments(category?: PortalCategory): Promise<StoredFileRecord[]> {
  if (category) {
    const entries = await listSupabaseFolder(category);
    return entries.map((entry) => entry.record);
  }

  const [manuals, rules] = await Promise.all([listSupabaseFolder("manual"), listSupabaseFolder("rule")]);
  return [...manuals, ...rules]
    .map((entry) => entry.record)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function saveSupabaseDocument(fileName: string, category: PortalCategory, buffer: Buffer): Promise<StoredFileRecord> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase storage is not configured.");
  }

  const id = randomUUID();
  const safeName = sanitizeFileName(fileName);
  const objectPath = `${category}/${id}-${safeName}`;
  const response = await supabaseRequest(`/storage/v1/object/${config.bucket}/${encodeStoragePath(objectPath)}`, {
    method: "POST",
    headers: {
      "Content-Type": getContentType(safeName),
      "x-upsert": "true"
    },
    body: new Uint8Array(buffer)
  });

  if (!response.ok) {
    throw new Error(`Failed to upload document to Supabase: ${response.status}`);
  }

  return {
    id,
    fileName: safeName,
    category,
    url: `/api/files/${id}/download`,
    createdAt: new Date().toISOString()
  };
}

async function deleteSupabaseDocument(id: string) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase storage is not configured.");
  }

  const matched = await findSupabaseObject(id);

  if (!matched) {
    return null;
  }

  const response = await supabaseRequest(`/storage/v1/object/${config.bucket}/${encodeStoragePath(matched.objectPath)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`Failed to delete document from Supabase: ${response.status}`);
  }

  return matched.record;
}

async function getSupabaseDocument(id: string) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase storage is not configured.");
  }

  const matched = await findSupabaseObject(id);

  if (!matched) {
    return null;
  }

  const response = await supabaseRequest(`/storage/v1/object/${config.bucket}/${encodeStoragePath(matched.objectPath)}`);

  if (!response.ok) {
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    record: matched.record,
    buffer,
    contentType: response.headers.get("content-type") ?? getContentType(matched.record.fileName),
    size: Number(response.headers.get("content-length") ?? buffer.length)
  };
}

export async function listStoredDocuments(category?: PortalCategory): Promise<StoredFileRecord[]> {
  if (getSupabaseConfig()) {
    return listSupabaseDocuments(category);
  }

  return listLocalDocuments(category);
}

export async function saveUploadedDocument(
  fileName: string,
  category: PortalCategory,
  buffer: Buffer
): Promise<StoredFileRecord> {
  if (getSupabaseConfig()) {
    return saveSupabaseDocument(fileName, category, buffer);
  }

  return saveLocalDocument(fileName, category, buffer);
}

export async function deleteStoredDocument(id: string) {
  if (getSupabaseConfig()) {
    return deleteSupabaseDocument(id);
  }

  return deleteLocalDocument(id);
}

export async function getStoredDocument(id: string) {
  if (getSupabaseConfig()) {
    return getSupabaseDocument(id);
  }

  return getLocalDocument(id);
}
