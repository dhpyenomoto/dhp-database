import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dhp都市開発GP プロジェクト情報データベース",
  description: "dhp都市開発グループ 社内プロジェクト情報データベース",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
