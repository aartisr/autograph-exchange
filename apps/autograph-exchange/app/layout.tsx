import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import "@aartisr/autograph-feature/styles.css";
import { Providers } from "./providers";
import { getSiteUrl } from "./lib/site-url";

const siteUrl = getSiteUrl();
const title = "Autograph Exchange | ForeverLotus";
const description = "A joyful, reusable digital autograph experience for communities, schools, and events.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
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
    siteName: "Autograph Exchange",
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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://foreverlotus.com/#organization",
      name: "ForeverLotus",
      url: "https://foreverlotus.com",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Autograph Exchange",
      url: siteUrl,
      description,
      inLanguage: "en-US",
      publisher: {
        "@id": "https://foreverlotus.com/#organization",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "Autograph Exchange",
      url: siteUrl,
      description,
      applicationCategory: "SocialNetworkingApplication",
      operatingSystem: "Web",
      inLanguage: "en-US",
      isAccessibleForFree: true,
      publisher: {
        "@id": "https://foreverlotus.com/#organization",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
