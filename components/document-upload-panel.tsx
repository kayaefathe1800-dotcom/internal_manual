"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { StoredFileRecord } from "../types/portal";

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

export function DocumentUploadPanel({ initialFiles, isAdmin }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<StoredFileRecord[]>(initialFiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  async function refreshFiles() {
    setLoading(true);

    try {
      const response = await fetch("/api/files", {
        cache: "no-store"
      });
      const data = (await response.json()) as FilesResponse;

      if (!response.ok || !data.files) {
        throw new Error(data.error ?? "資料一覧の取得に失敗しました。");
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

    if (!file || !isAdmin) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      setError(null);
      setMessage("");

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok || !data.id || !data.fileName || !data.url || !data.createdAt) {
        setError(data.error ?? "アップロードに失敗しました。");
        return;
      }

      setFiles((current) => [
        {
          id: data.id!,
          fileName: data.fileName!,
          url: data.url!,
          createdAt: data.createdAt!
        },
        ...current
      ]);
      setMessage(`「${data.fileName}」をアップロードしました。`);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  }

  async function handleDelete(file: StoredFileRecord) {
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm("本当に削除しますか？");

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage("");

    const response = await fetch(`/api/files/${file.id}`, {
      method: "DELETE"
    });
    const data = (await response.json()) as { success?: boolean; error?: string };

    if (!response.ok || !data.success) {
      setError(data.error ?? "削除に失敗しました。");
      return;
    }

    setFiles((current) => current.filter((currentFile) => currentFile.id !== file.id));
    setMessage(`「${file.fileName}」を削除しました。`);
  }

  function handleView(file: StoredFileRecord) {
    window.open(file.url, "_blank", "noopener,noreferrer");
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="surface-panel" id="document-upload">
      <div className="page-heading">
        <div>
          <p className="section-label">資料アップロード</p>
          <h1>管理者向け資料管理</h1>
        </div>
        <button type="button" className="ghost-link toolbar-button" onClick={() => void refreshFiles()} disabled={loading}>
          {loading ? "更新中..." : "一覧を更新"}
        </button>
      </div>

      <div className="upload-panel-grid">
        <div className="upload-dropzone">
          <p className="upload-title">管理者のみ、資料のアップロード・閲覧・削除ができます。</p>
          <p className="upload-copy">
            ファイルをアップロードすると一覧へ即時反映されます。対応形式は PDF、Word、Excel、CSV、テキスト、PowerPoint です。
          </p>
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
                    <strong>{file.fileName}</strong>
                    <span>登録: {formatDate(file.createdAt)}</span>
                  </div>
                  <div className="stored-file-actions">
                    <button type="button" className="ghost-link action-button" onClick={() => handleView(file)}>
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
