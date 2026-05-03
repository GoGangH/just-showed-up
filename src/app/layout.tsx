import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "일단옴",
  description: "모임 전에 남기는 이번 주 기록과 익명 피드백",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
