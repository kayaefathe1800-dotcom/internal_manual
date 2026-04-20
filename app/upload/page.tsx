import { DocumentUploadPanel } from "../../components/document-upload-panel";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { listStoredDocuments } from "../../lib/document-storage";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const user = await getCurrentUser();
  const storedDocuments = user?.isAdmin ? await listStoredDocuments() : [];

  return (
    <SiteShell user={user} requireAdmin>
      <DocumentUploadPanel initialFiles={storedDocuments} isAdmin={Boolean(user?.isAdmin)} />
    </SiteShell>
  );
}
