import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "../../../components/site-shell";
import { getCurrentUser } from "../../../lib/auth";
import { getDocumentBySlug } from "../../../lib/search";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ManualDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const document = getDocumentBySlug(slug);

  if (!document || document.category !== "manual") {
    notFound();
  }

  return (
    <SiteShell user={user}>
      <section className="detail-panel">
        <Link href="/manuals" className="back-link">
          ← マニュアル一覧へ戻る
        </Link>

        <div className="detail-grid">
          <article>
            <div className="page-heading">
              <div>
                <p className="section-label">マニュアル詳細</p>
                <h1>{document.title}</h1>
              </div>
              <span className="document-meta">更新日 {document.updatedAt}</span>
            </div>

            <p className="detail-copy">{document.summary}</p>

            <div className="search-tags">
              {document.tags.map((tag) => (
                <span key={`${document.id}-${tag}`} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="detail-sections">
              <section>
                <h2>本文</h2>
                <p className="detail-copy">{document.body}</p>
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
            <p className="attachment-note">MVP ではサンプル PDF を埋め込み表示しています。</p>
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
