"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { StoredDocument } from "../lib/document-storage";

type Props = {
  documents: StoredDocument[];
  storageFolderName: string;
};

type UploadResponse = {
  success?: boolean;
  fileName?: string;
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

export function DocumentUploadPanel({ documents, storageFolderName }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      setMessage("");
      setError("");

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as UploadResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? "資料のアップロードに失敗しました。");
        return;
      }

      setMessage(`「${data.fileName}」を保存しました。`);
      router.refresh();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  }

  return (
    <section className="surface-panel" id="document-upload">
      <div className="page-heading">
        <div>
          <p className="section-label">資料アップロード</p>
          <h2>社内資料をアップロード</h2>
        </div>
        <span className="muted-text">保存先フォルダ: {storageFolderName}</span>
      </div>

      <div className="upload-panel-grid">
        <div className="upload-dropzone">
          <p className="upload-title">PDF、Word、Excel、テキストなどをアップロードできます。</p>
          <p className="upload-copy">
            選択した資料はワークスペース内の「{storageFolderName}」フォルダへ保存されます。
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
          {documents.length > 0 ? (
            <div className="stored-file-list">
              {documents.map((document) => (
                <article key={`${document.name}-${document.updatedAt}`} className="stored-file-item">
                  <strong>{document.name}</strong>
                  <span>
                    更新: {formatDate(document.updatedAt)} / サイズ: {document.size.toLocaleString()} bytes
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted-text">まだ資料は保存されていません。</p>
          )}
        </div>
      </div>
    </section>
  );
}
