import type { Metadata } from "next";
import { Syne, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/providers/Providers";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "E-Cell SRMIST — Recruitment 2026",
  description:
    "Recruitment website for E-Cell SRMIST. Think. Build. Scale. Join India's largest student-run entrepreneurship cell.",
  openGraph: {
    title: "E-Cell SRMIST — Recruitment 2026",
    description:
      "Recruitment website for E-Cell SRMIST. Think. Build. Scale.",
    type: "website",
    images: [
      {
        url: "/assets/hero.png",
        width: 1181,
        height: 603,
        alt: "E-Cell SRMIST E-Summit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Cell SRMIST — Recruitment 2026",
    description: "Recruitment website for E-Cell SRMIST.",
    images: ["/assets/hero.png"],
  },
  icons: {
    icon: "/assets/logowhite.png",
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
      className={`${syne.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
