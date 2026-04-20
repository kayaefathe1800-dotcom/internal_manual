import type { Metadata, Viewport } from "next";
import { AuthProvider } from "../components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "社内ナレッジポータル",
  description:
    "社内マニュアルと就業規則を検索・閲覧できる、Next.js + Supabase 前提の社内共有ポータル MVP です。",
  applicationName: "社内ナレッジポータル",
  keywords: ["社内ポータル", "社内マニュアル", "就業規則", "ナレッジ検索", "Next.js", "Supabase"],
  icons: {
    icon: "/icon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#f4efe6"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
