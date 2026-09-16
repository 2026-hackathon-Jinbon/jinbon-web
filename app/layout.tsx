import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:8071";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "진본 | 영상 진본 검증",
    description: "영상의 블록체인 등록 기록과 OpenDID 자격증명을 교차 검증합니다.",
    icons: {
      icon: [{ url: "/favicon.png", type: "image/png", sizes: "32x32" }],
      apple: [{ url: "/jinbon-logo.png", type: "image/png", sizes: "180x180" }],
    },
    openGraph: {
      title: "진본 | 영상의 진실을 확인하다",
      description: "블록체인 등록 기록과 OpenDID 자격증명으로 영상의 진본 여부를 확인하세요.",
      images: [{ url: `${origin}/jinbon-share.png`, width: 1024, height: 1024, alt: "진본 영상 진본 검증" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "진본 | 영상의 진실을 확인하다",
      description: "블록체인과 OpenDID로 영상의 진본 여부를 확인하세요.",
      images: [`${origin}/jinbon-share.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
