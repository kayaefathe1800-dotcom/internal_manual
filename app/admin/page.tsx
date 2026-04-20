import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "../../components/site-shell";
import { announcements, popularQueries, portalDocuments } from "../../data/portal-content";
import { getCurrentUser } from "../../lib/auth";
import { getDocumentStats } from "../../lib/search";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (!user.isAdmin) {
    redirect("/");
  }

  const stats = getDocumentStats(portalDocuments);

  return (
    <SiteShell user={user}>
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">管理者ページ</p>
            <h1>運用ダッシュボード</h1>
          </div>
          <p>管理者専用の資料管理と、今後の本番連携に向けた状況を確認できます。</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{stats.total}</strong>
            <span>公開中ドキュメント</span>
          </div>
          <div className="stat-card">
            <strong>{announcements.length}</strong>
            <span>掲載中のお知らせ</span>
          </div>
          <div className="stat-card">
            <strong>{popularQueries.length}</strong>
            <span>人気検索キーワード</span>
          </div>
          <div className="stat-card">
            <strong>2</strong>
            <span>権限ロール数</span>
          </div>
        </div>
      </section>

      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">次の拡張候補</p>
            <h2>本番化に向けた作業</h2>
          </div>
        </div>
        <div className="document-grid">
          <article className="document-list-card">
            <h3>Supabase Auth 連携</h3>
            <p>現在のデモログインを、実社員アカウント連携へ置き換えます。</p>
          </article>
          <article className="document-list-card">
            <h3>資料メタ情報の DB 化</h3>
            <p>manifest ベースの管理を、Supabase のテーブル管理へ切り替えます。</p>
          </article>
          <article className="document-list-card">
            <h3>ストレージ永続化</h3>
            <p>本番では Supabase Storage か Vercel Blob に切り替えると安全です。</p>
          </article>
        </div>
        <Link href="/" className="ghost-link">
          トップへ戻る
        </Link>
      </section>
    </SiteShell>
  );
}
