import Link from "next/link";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { listStoredDocuments } from "../../lib/document-storage";
import { getDocumentsByCategory } from "../../lib/search";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const user = await getCurrentUser();
  const rules = getDocumentsByCategory("rule");
  const uploadedRules = await listStoredDocuments("rule");

  return (
    <SiteShell user={user}>
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">就業規則</p>
            <h1>就業規則・ルール</h1>
          </div>
          <p>勤怠、休暇、福利厚生など、社内ルールを一覧で確認できます。</p>
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

      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">アップロード資料</p>
            <h2>管理者が登録した就業規則資料</h2>
          </div>
        </div>

        <div className="document-grid">
          {uploadedRules.length > 0 ? (
            uploadedRules.map((file) => (
              <article key={file.id} className="document-list-card">
                <div className="document-card-header">
                  <span className="result-category is-rule">就業規則</span>
                  <span className="document-meta">登録日 {file.createdAt.slice(0, 10)}</span>
                </div>
                <h3>{file.fileName}</h3>
                <p>資料アップロード画面から登録された就業規則資料です。</p>
                <Link href={file.url} className="solid-link">
                  資料を開く
                </Link>
              </article>
            ))
          ) : (
            <p className="muted-text">アップロード済みの就業規則資料はまだありません。</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
