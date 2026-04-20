"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { authFetch } from "../lib/auth-client";
import { useAuth } from "./auth-provider";
import type { PortalCategory, StoredFileRecord } from "../types/portal";

type Props = {
  initialFiles: StoredFileRecord[];
  isAdmin: boolean;
};

type FilesResponse = {
  files?: StoredFileRecord[];
  error?: string;
};

type UploadResponse = {
  id?: string;
  fileName?: string;
  category?: PortalCategory;
  url?: string;
  createdAt?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getCategoryLabel(category: PortalCategory) {
  return category === "manual" ? "マニュアル" : "就業規則";
}

async function readJsonSafely<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function DocumentUploadPanel({ initialFiles, isAdmin }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<StoredFileRecord[]>(initialFiles);
  const [category, setCategory] = useState<PortalCategory>("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const canManageFiles = isAdmin || Boolean(user?.isAdmin);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  useEffect(() => {
    if (canManageFiles && initialFiles.length === 0) {
      void refreshFiles();
    }
  }, [canManageFiles, initialFiles.length]);

  async function refreshFiles() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/files", {
        cache: "no-store"
      });
      const data = await readJsonSafely<FilesResponse>(response);

      if (!response.ok || !data?.files) {
        throw new Error(data?.error ?? "資料一覧の取得に失敗しました。");
      }

      setFiles(data.files);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "資料一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !canManageFiles) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    startTransition(async () => {
      setError(null);
      setMessage("");

      try {
        const response = await authFetch("/api/files", {
          method: "POST",
          body: formData
        });
        const data = await readJsonSafely<UploadResponse>(response);

        if (!response.ok || !data?.id) {
          throw new Error(data?.error ?? "アップロードに失敗しました。");
        }

        await refreshFiles();
        setMessage(`${data.fileName ?? "資料"} を ${getCategoryLabel(data.category ?? category)} としてアップロードしました。`);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "アップロードに失敗しました。");
      }
    });
  }

  async function handleDelete(file: StoredFileRecord) {
    if (!canManageFiles) {
      return;
    }

    const confirmed = window.confirm("本当に削除しますか？");

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage("");

    try {
      const response = await authFetch(`/api/files/${file.id}`, {
        method: "DELETE"
      });
      const data = await readJsonSafely<{ success?: boolean; error?: string }>(response);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error ?? "削除に失敗しました。");
      }

      setFiles((current) => current.filter((currentFile) => currentFile.id !== file.id));
      setMessage(`${file.fileName} を削除しました。`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "削除に失敗しました。");
    }
  }

  async function handleView(file: StoredFileRecord) {
    try {
      const response = await authFetch(file.url, {
        cache: "no-store"
      });

      if (!response.ok) {
        const data = await readJsonSafely<{ error?: string }>(response);
        throw new Error(data?.error ?? "資料の表示に失敗しました。");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "資料の表示に失敗しました。");
    }
  }

  if (!canManageFiles) {
    return null;
  }

  return (
    <section className="surface-panel" id="document-upload">
      <div className="page-heading">
        <div>
          <p className="section-label">資料アップロード</p>
          <h1>管理者専用の資料管理</h1>
        </div>
        <button type="button" className="ghost-link toolbar-button" onClick={() => void refreshFiles()} disabled={loading}>
          {loading ? "更新中..." : "一覧を更新"}
        </button>
      </div>

      <div className="upload-panel-grid">
        <div className="upload-dropzone">
          <p className="upload-title">アップロード時にカテゴリーを必ず選択します。</p>
          <p className="upload-copy">
            ファイルは `マニュアル` または `就業規則` として保存され、それぞれの一覧ページに表示されます。
          </p>

          <div className="field-group">
            <label className="field-label" htmlFor="upload-category">
              カテゴリー
            </label>
            <select
              id="upload-category"
              className="select-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as PortalCategory)}
            >
              <option value="manual">マニュアル</option>
              <option value="rule">就業規則</option>
            </select>
          </div>

          <button type="button" className="submit-button upload-button-wide" onClick={handleChooseFile} disabled={isPending}>
            {isPending ? "アップロード中..." : "資料を選択する"}
          </button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx"
          />
          {message ? <p className="upload-success">{message}</p> : null}
          {error ? <p className="upload-error">{error}</p> : null}
        </div>

        <div className="document-list-card">
          <h3>保存済み資料</h3>
          {files.length > 0 ? (
            <div className="stored-file-list">
              {files.map((file) => (
                <article key={file.id} className="stored-file-item">
                  <div className="stored-file-header">
                    <div>
                      <strong>{file.fileName}</strong>
                      <div className="result-meta">
                        <span className={file.category === "manual" ? "result-category is-manual" : "result-category is-rule"}>
                          {getCategoryLabel(file.category)}
                        </span>
                        <span>登録日: {formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="stored-file-actions">
                    <Link href={file.category === "manual" ? "/manuals" : "/rules"} className="ghost-link action-button">
                      表示先を見る
                    </Link>
                    <button type="button" className="ghost-link action-button" onClick={() => void handleView(file)}>
                      閲覧
                    </button>
                    <button type="button" className="danger-button action-button" onClick={() => void handleDelete(file)}>
                      削除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted-text">保存済みの資料はまだありません。</p>
          )}
        </div>
      </div>
    </section>
  );
}
