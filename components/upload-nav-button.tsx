"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

type Props = {
  isActive: boolean;
  initialIsAdmin: boolean;
};

export function UploadNavButton({ isActive, initialIsAdmin }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (!initialIsAdmin && !user?.isAdmin) {
    return null;
  }

  async function handleClick() {
    if (loading) {
      return;
    }

    if (user?.isAdmin) {
      router.push("/upload");
      return;
    }

    router.push("/login?redirect=%2Fupload");
  }

  return (
    <button
      type="button"
      className={isActive ? "nav-link is-active nav-upload-link" : "nav-link nav-upload-link"}
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? "確認中..." : "資料アップロード"}
    </button>
  );
}
