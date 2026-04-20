import os from "node:os";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PortalCategory, StoredFileRecord } from "../types/portal";

const BUNDLED_DOCUMENTS_DIR = path.join(process.cwd(), "data", "documents");
const RUNTIME_DOCUMENTS_DIR =
  process.env.NODE_ENV === "production"
    ? path.join(os.tmpdir(), "data", "documents")
    : BUNDLED_DOCUMENTS_DIR;
const MANIFEST_FILE_NAME = "manifest.json";

type RuntimeManifestRecord = StoredFileRecord;

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");
}

function getManifestPath(baseDir: string) {
  return path.join(baseDir, MANIFEST_FILE_NAME);
}

function getCategoryDir(baseDir: string, category: PortalCategory) {
  return path.join(baseDir, category);
}

async function ensureDir(targetDir: string) {
  await mkdir(targetDir, { recursive: true });
  return targetDir;
}

async function ensureCategoryDirs(baseDir: string) {
  await ensureDir(baseDir);
  await Promise.all([ensureDir(getCategoryDir(baseDir, "manual")), ensureDir(getCategoryDir(baseDir, "rule"))]);
}

async function readRuntimeManifest(baseDir: string): Promise<RuntimeManifestRecord[]> {
  await ensureCategoryDirs(baseDir);

  try {
    const raw = await readFile(getManifestPath(baseDir), "utf8");
    const parsed = JSON.parse(raw) as RuntimeManifestRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRuntimeManifest(baseDir: string, records: RuntimeManifestRecord[]) {
  await ensureCategoryDirs(baseDir);
  await writeFile(getManifestPath(baseDir), JSON.stringify(records, null, 2), "utf8");
}

function buildRecord(id: string, fileName: string, category: PortalCategory, createdAt?: string): StoredFileRecord {
  return {
    id,
    fileName: sanitizeFileName(fileName),
    category,
    url: `/api/files/${id}/download`,
    createdAt: createdAt ?? new Date().toISOString()
  };
}

function inferRecordFromFileName(fileName: string, category: PortalCategory, createdAt?: string) {
  const safeName = sanitizeFileName(fileName);
  const separatorIndex = safeName.indexOf("-");

  if (separatorIndex > 0) {
    const maybeId = safeName.slice(0, separatorIndex);
    const cleanedName = safeName.slice(separatorIndex + 1);
    return buildRecord(maybeId, cleanedName, category, createdAt);
  }

  return buildRecord(safeName, safeName, category, createdAt);
}

async function listBundledCategory(category: PortalCategory) {
  const categoryDir = getCategoryDir(BUNDLED_DOCUMENTS_DIR, category);
  const files = await readdir(categoryDir, { withFileTypes: true }).catch(() => []);

  const results = await Promise.all(
    files
      .filter((entry) => entry.isFile() && entry.name !== MANIFEST_FILE_NAME)
      .map(async (entry) => {
        const fullPath = path.join(categoryDir, entry.name);
        const fileInfo = await stat(fullPath);
        return {
          record: inferRecordFromFileName(entry.name, category, fileInfo.mtime.toISOString()),
          sourcePath: fullPath
        };
      })
  );

  return results;
}

async function listBundledRootFiles() {
  const files = await readdir(BUNDLED_DOCUMENTS_DIR, { withFileTypes: true }).catch(() => []);

  const results = await Promise.all(
    files
      .filter((entry) => entry.isFile() && entry.name !== MANIFEST_FILE_NAME)
      .map(async (entry) => {
        const fullPath = path.join(BUNDLED_DOCUMENTS_DIR, entry.name);
        const fileInfo = await stat(fullPath);
        return {
          record: inferRecordFromFileName(entry.name, "manual", fileInfo.mtime.toISOString()),
          sourcePath: fullPath
        };
      })
  );

  return results;
}

async function listBundledDocuments() {
  await ensureCategoryDirs(BUNDLED_DOCUMENTS_DIR);
  const [manuals, rules, rootFiles] = await Promise.all([
    listBundledCategory("manual"),
    listBundledCategory("rule"),
    listBundledRootFiles()
  ]);

  const unique = new Map<string, StoredFileRecord>();

  for (const entry of [...manuals, ...rules, ...rootFiles]) {
    unique.set(entry.record.id, entry.record);
  }

  return [...unique.values()];
}

async function listRuntimeDocuments() {
  const records = await readRuntimeManifest(RUNTIME_DOCUMENTS_DIR);
  return records;
}

function sortRecords(records: StoredFileRecord[]) {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listStoredDocuments(category?: PortalCategory): Promise<StoredFileRecord[]> {
  const [bundled, runtime] = await Promise.all([listBundledDocuments(), listRuntimeDocuments()]);
  const merged = new Map<string, StoredFileRecord>();

  for (const record of [...bundled, ...runtime]) {
    merged.set(record.id, record);
  }

  const filtered = [...merged.values()].filter((record) => (category ? record.category === category : true));
  return sortRecords(filtered);
}

export async function saveUploadedDocument(
  fileName: string,
  category: PortalCategory,
  buffer: Buffer
): Promise<StoredFileRecord> {
  await ensureCategoryDirs(RUNTIME_DOCUMENTS_DIR);
  const manifest = await readRuntimeManifest(RUNTIME_DOCUMENTS_DIR);
  const id = randomUUID();
  const safeName = sanitizeFileName(fileName);
  const storedFileName = `${id}-${safeName}`;
  const targetPath = path.join(getCategoryDir(RUNTIME_DOCUMENTS_DIR, category), storedFileName);

  await writeFile(targetPath, buffer);

  const record = buildRecord(id, safeName, category);
  await writeRuntimeManifest(RUNTIME_DOCUMENTS_DIR, [record, ...manifest]);
  return record;
}

export async function deleteStoredDocument(id: string) {
  const manifest = await readRuntimeManifest(RUNTIME_DOCUMENTS_DIR);
  const targetRecord = manifest.find((record) => record.id === id);

  if (!targetRecord) {
    return null;
  }

  const categoryDir = getCategoryDir(RUNTIME_DOCUMENTS_DIR, targetRecord.category);
  const fileNames = await readdir(categoryDir).catch(() => [] as string[]);
  const matchedFile = fileNames.find((name) => name.startsWith(`${id}-`));

  if (matchedFile) {
    await unlink(path.join(categoryDir, matchedFile)).catch(() => undefined);
  }

  await writeRuntimeManifest(
    RUNTIME_DOCUMENTS_DIR,
    manifest.filter((record) => record.id !== id)
  );

  return targetRecord;
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

async function findBundledDocument(id: string) {
  const documents = await listBundledDocuments();
  const record = documents.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  const categoryDir = getCategoryDir(BUNDLED_DOCUMENTS_DIR, record.category);
  const categoryFiles = await readdir(categoryDir).catch(() => [] as string[]);
  const categoryMatch = categoryFiles.find((fileName) => fileName.startsWith(`${id}-`) || sanitizeFileName(fileName) === record.fileName);

  if (categoryMatch) {
    return {
      record,
      filePath: path.join(categoryDir, categoryMatch)
    };
  }

  const rootFiles = await readdir(BUNDLED_DOCUMENTS_DIR).catch(() => [] as string[]);
  const rootMatch = rootFiles.find((fileName) => fileName.startsWith(`${id}-`) || sanitizeFileName(fileName) === record.fileName);

  if (!rootMatch) {
    return null;
  }

  return {
    record,
    filePath: path.join(BUNDLED_DOCUMENTS_DIR, rootMatch)
  };
}

async function findRuntimeDocument(id: string) {
  const manifest = await readRuntimeManifest(RUNTIME_DOCUMENTS_DIR);
  const record = manifest.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  const categoryDir = getCategoryDir(RUNTIME_DOCUMENTS_DIR, record.category);
  const fileNames = await readdir(categoryDir).catch(() => [] as string[]);
  const matchedFile = fileNames.find((fileName) => fileName.startsWith(`${id}-`));

  if (!matchedFile) {
    return null;
  }

  return {
    record,
    filePath: path.join(categoryDir, matchedFile)
  };
}

export async function getStoredDocument(id: string) {
  const runtimeMatch = await findRuntimeDocument(id);
  const bundledMatch = runtimeMatch ? null : await findBundledDocument(id);
  const target = runtimeMatch ?? bundledMatch;

  if (!target) {
    return null;
  }

  const fileInfo = await stat(target.filePath);
  const buffer = await readFile(target.filePath);

  return {
    record: target.record,
    buffer,
    contentType: getContentType(target.record.fileName),
    size: fileInfo.size
  };
}
