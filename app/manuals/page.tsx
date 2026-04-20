import Link from "next/link";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { listStoredDocuments } from "../../lib/document-storage";
import { getDocumentsByCategory } from "../../lib/search";

export const dynamic = "force-dynamic";

export default async function ManualsPage() {
  const user = await getCurrentUser();
  const manuals = getDocumentsByCategory("manual");
  const uploadedManuals = await listStoredDocuments("manual");

  return (
    <SiteShell user={user}>
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">マニュアル一覧</p>
            <h1>社内マニュアル</h1>
          </div>
          <p>運用手順や申請フローをカテゴリ別に確認できます。</p>
        </div>

        <div className="document-grid">
          {manuals.map((manual) => (
            <article key={manual.id} className="document-list-card">
              <div className="document-card-header">
                <span className="result-category is-manual">マニュアル</span>
                <span className="document-meta">更新日 {manual.updatedAt}</span>
              </div>
              <h3>{manual.title}</h3>
              <p>{manual.summary}</p>
              <div className="search-tags">
                {manual.tags.map((tag) => (
                  <span key={`${manual.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/manuals/${manual.slug}`} className="solid-link">
                詳細を見る
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">アップロード資料</p>
            <h2>管理者が登録したマニュアル資料</h2>
          </div>
        </div>

        <div className="document-grid">
          {uploadedManuals.length > 0 ? (
            uploadedManuals.map((file) => (
              <article key={file.id} className="document-list-card">
                <div className="document-card-header">
                  <span className="result-category is-manual">マニュアル</span>
                  <span className="document-meta">登録日 {file.createdAt.slice(0, 10)}</span>
                </div>
                <h3>{file.fileName}</h3>
                <p>資料アップロード画面から登録されたマニュアル資料です。</p>
                <Link href={file.url} className="solid-link">
                  資料を開く
                </Link>
              </article>
            ))
          ) : (
            <p className="muted-text">アップロード済みのマニュアル資料はまだありません。</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
