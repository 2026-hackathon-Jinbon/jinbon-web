import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:8071";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "진본 | 영상 진본 검증",
    description: "영상의 블록체인 등록 기록과 OpenDID 자격증명을 교차 검증합니다.",
    openGraph: {
      title: "진본 | 영상의 진실을 확인하다",
      description: "블록체인 등록 기록과 OpenDID 자격증명으로 영상의 진본 여부를 확인하세요.",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "진본 영상 진본 검증" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "진본 | 영상의 진실을 확인하다",
      description: "블록체인과 OpenDID로 영상의 진본 여부를 확인하세요.",
      images: [`${origin}/og.png`],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
