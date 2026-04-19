import Link from "next/link";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { getDocumentsByCategory } from "../../lib/search";

export default async function ManualsPage() {
  const user = await getCurrentUser();
  const manuals = getDocumentsByCategory("manual");

  return (
    <SiteShell user={user}>
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">マニュアル一覧</p>
            <h1>社内マニュアル</h1>
          </div>
          <p>運用手順や申請フローをカテゴリ横断で確認できます。</p>
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
    </SiteShell>
  );
}
