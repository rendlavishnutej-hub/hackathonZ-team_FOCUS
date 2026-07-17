import type { Metadata } from "next";
import { Anton, Inter, Plus_Jakarta_Sans, Fredoka } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://focus-ai.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "FOCUS — Orchestrate the Future of Learning",
    template: "%s | FOCUS AI",
  },
  description:
    "FOCUS dynamically coordinates specialist AI agents powered by Gemini to research, design, and generate complete personalised learning experiences from a single prompt.",
  keywords: [
    "AI learning platform",
    "multi-agent AI",
    "personalised learning",
    "Gemini AI",
    "educational AI",
    "AI curriculum generator",
    "FOCUS AI",
    "agent orchestration",
  ],
  authors: [{ name: "FOCUS AI Team" }],
  creator: "FOCUS AI",
  publisher: "FOCUS AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "FOCUS AI",
    title: "FOCUS — Orchestrate the Future of Learning",
    description:
      "Stop the daily hassle of disconnected tools. FOCUS dynamically coordinates specialist AI agents to research, design, and generate complete personalised learning experiences.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FOCUS AI — Multi-Agent Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FOCUS — Orchestrate the Future of Learning",
    description:
      "AI agents that research, design, and generate complete learning experiences from a single prompt.",
    images: ["/og-image.png"],
    creator: "@focusai",
  },
  verification: {
    google: "",
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${plusJakarta.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
