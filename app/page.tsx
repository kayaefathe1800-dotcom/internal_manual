import { SearchExperience } from "../components/search-experience";
import { SiteShell } from "../components/site-shell";
import { announcements, popularQueries, portalDocuments } from "../data/portal-content";
import { getCurrentUser } from "../lib/auth";
import { getDocumentStats } from "../lib/search";

export default async function Home() {
  const user = await getCurrentUser();
  const stats = getDocumentStats(portalDocuments);

  return (
    <SiteShell user={user}>
      <section className="hero-panel">
        <div className="hero-copy-block">
          <p className="eyebrow">社内ポータル MVP</p>
          <h1>社内マニュアルと就業規則を、まとめて検索</h1>
          <p className="hero-description">
            タイトル・本文・タグを対象に、通常検索とあいまい検索を組み合わせて必要な情報へすばやくアクセスできます。
            将来的な AI 検索追加を見据えて、検索ロジックは API として分離しています。
          </p>
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

      <SearchExperience popularQueries={popularQueries} />
    </SiteShell>
  );
}
