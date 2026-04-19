import Link from "next/link";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { getDocumentsByCategory } from "../../lib/search";

export default async function RulesPage() {
  const user = await getCurrentUser();
  const rules = getDocumentsByCategory("rule");

  return (
    <SiteShell user={user}>
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">就業規則</p>
            <h1>就業規則・ルール</h1>
          </div>
          <p>休暇、勤怠、連絡ルールなど、社内運用の基準を確認できます。</p>
        </div>

        <div className="document-grid">
          {rules.map((rule) => (
            <article key={rule.id} className="document-list-card">
              <div className="document-card-header">
                <span className="result-category is-rule">就業規則</span>
                <span className="document-meta">更新日 {rule.updatedAt}</span>
              </div>
              <h3>{rule.title}</h3>
              <p>{rule.summary}</p>
              <div className="search-tags">
                {rule.tags.map((tag) => (
                  <span key={`${rule.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/rules/${rule.slug}`} className="solid-link">
                詳細を見る
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
