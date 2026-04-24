import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "@aartisr/autograph-feature/styles.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import {
  authorName,
  authorUrl,
  buildPageMetadata,
  organizationName,
  siteDescription,
  siteJsonLd,
  siteKeywords,
  siteName,
  siteTitle,
  siteUrl,
} from "./lib/seo";

const title = siteTitle;
const description = siteDescription;

export const metadata: Metadata = {
  ...buildPageMetadata({
    title,
    description,
  }),
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: authorName, url: authorUrl }],
  creator: authorName,
  publisher: organizationName,
  category: "social",
  classification: "Digital autograph and keepsake sharing",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: "/autograph-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/autograph-icon.svg" }],
    shortcut: ["/autograph-icon.svg"],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Autograph Exchange social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/twitter-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
