import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brief.mosunbrief.kr"),
  title: "Mosun Brief – 아직 AI로 무언가를 만들지 못한 당신에게",
  description:
    "그저 아는 자가 아닌, AI창작자로 — 이번 주 당신을 위한 맞춤 브리핑",
  openGraph: {
    title: "Mosun Brief – 아직 AI로 무언가를 만들지 못한 당신에게",
    description:
      "그저 아는 자가 아닌, AI창작자로 — 이번 주 당신을 위한 맞춤 브리핑",
    url: "https://brief.mosunbrief.kr",
    siteName: "Mosun Brief — Personal AI Briefing",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosun Brief – 아직 AI로 무언가를 만들지 못한 당신에게",
    description:
      "그저 아는 자가 아닌, AI창작자로 — 이번 주 당신을 위한 맞춤 브리핑",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}