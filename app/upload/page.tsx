import { redirect } from "next/navigation";
import { DocumentUploadPanel } from "../../components/document-upload-panel";
import { SiteShell } from "../../components/site-shell";
import { getCurrentUser } from "../../lib/auth";
import { listStoredDocuments } from "../../lib/document-storage";

export default async function UploadPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/upload");
  }

  if (!user.isAdmin) {
    redirect("/");
  }

  const storedDocuments = await listStoredDocuments();

  return (
    <SiteShell user={user}>
      <DocumentUploadPanel initialFiles={storedDocuments} isAdmin={true} />
    </SiteShell>
  );
}
