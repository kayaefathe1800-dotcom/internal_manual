import { DocumentUploadPanel } from "../../components/document-upload-panel";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { listStoredDocuments } from "../../lib/document-storage";

export default async function UploadPage() {
  const user = await getCurrentUser();
  const storedDocuments = await listStoredDocuments();

  return (
    <SiteShell user={user}>
      <section className="surface-panel">
        <div className="page-heading">
          <div>
            <p className="section-label">資料管理</p>
            <h1>社内資料アップロード</h1>
          </div>
          <p>社内マニュアルや添付資料をここから保存できます。</p>
        </div>
      </section>

      <DocumentUploadPanel documents={storedDocuments} storageFolderName="社内資料" />
    </SiteShell>
  );
}
