import Link from "next/link";
import { DocumentUploadPanel } from "../components/document-upload-panel";
import { SearchExperience } from "../components/search-experience";
import { SiteShell } from "../components/site-shell";
import { announcements, popularQueries, portalDocuments } from "../data/portal-content";
import { getCurrentUser } from "../lib/auth";
import { listStoredDocuments } from "../lib/document-storage";
import { getDocumentStats } from "../lib/search";

export default async function Home() {
  const user = await getCurrentUser();
  const stats = getDocumentStats(portalDocuments);
  const storedDocuments = await listStoredDocuments();

  return (
    <SiteShell user={user}>
      <section className="hero-panel">
        <div className="hero-copy-block">
          <p className="eyebrow">社内ポータル MVP</p>
          <h1>社内マニュアルと就業規則を、自然な日本語でまとめて検索。</h1>
          <p className="hero-description">
            タイトル・本文・タグを対象に、通常検索とあいまい検索を組み合わせて必要な情報へすばやくアクセスできます。
            将来的な AI 検索追加を見据えて、検索ロジックは API として分離しています。
          </p>
          <div className="hero-actions">
            <Link href="#document-upload" className="solid-link hero-upload-link">
              UPLOAD / 資料アップロード
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{stats.total}</strong>
              <span>公開ドキュメント</span>
            </div>
            <div>
              <strong>{stats.manuals}</strong>
              <span>マニュアル</span>
            </div>
            <div>
              <strong>{stats.rules}</strong>
              <span>就業規則</span>
            </div>
          </div>
        </div>

        <div className="notice-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">最新のお知らせ</p>
              <h2>更新情報</h2>
            </div>
          </div>

          <div className="notice-list">
            {announcements.map((notice) => (
              <article key={notice.id} className="notice-card">
                <div className="notice-meta">
                  <span>{notice.publishedAt}</span>
                  <span>{notice.label}</span>
                </div>
                <h3>{notice.title}</h3>
                <p>{notice.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel upload-cta-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">UPLOAD</p>
            <h2>資料アップロードはこちら</h2>
          </div>
        </div>
        <Link href="#document-upload" className="solid-link upload-cta-link">
          UPLOAD / 資料アップロード
        </Link>
      </section>

      <DocumentUploadPanel documents={storedDocuments} storageFolderName="社内資料" />

      <SearchExperience popularQueries={popularQueries} />
    </SiteShell>
  );
}
