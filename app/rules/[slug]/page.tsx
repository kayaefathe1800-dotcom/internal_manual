import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "../../../components/site-shell";
import { getCurrentUser } from "../../../lib/auth";
import { getDocumentBySlug, getSynonymEntries } from "../../../lib/search";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RuleDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const document = getDocumentBySlug(slug);
  const synonyms = getSynonymEntries().slice(0, 4);

  if (!document || document.category !== "rule") {
    notFound();
  }

  return (
    <SiteShell user={user}>
      <section className="detail-panel">
        <Link href="/rules" className="back-link">
          ← 就業規則一覧へ戻る
        </Link>

        <div className="detail-grid">
          <article>
            <div className="page-heading">
              <div>
                <p className="section-label">就業規則詳細</p>
                <h1>{document.title}</h1>
              </div>
              <span className="document-meta">更新日 {document.updatedAt}</span>
            </div>

            <p className="detail-copy">{document.summary}</p>

            <div className="detail-sections">
              <section>
                <h2>本文</h2>
                <p className="detail-copy">{document.body}</p>
              </section>

              <section>
                <h2>検索用の同義語辞書例</h2>
                <ul>
                  {synonyms.map(([key, values]) => (
                    <li key={key}>
                      {key}: {values.join(" / ")}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>

          <aside className="attachment-box">
            <div className="attachment-head">
              <div>
                <p className="section-label">添付資料</p>
                <h2>{document.attachmentTitle ?? "PDF 資料"}</h2>
              </div>
            </div>
            <p className="attachment-note">就業規則の改定版 PDF を想定した表示領域です。</p>
            {document.attachmentUrl ? (
              <iframe
                className="pdf-frame"
                src={document.attachmentUrl}
                title={document.attachmentTitle ?? document.title}
              />
            ) : (
              <p className="muted-text">この文書には添付資料がありません。</p>
            )}
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
