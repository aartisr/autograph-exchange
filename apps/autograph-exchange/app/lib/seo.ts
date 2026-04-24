import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  imagePath?: string;
  imageAlt?: string;
};

export const siteUrl = getSiteUrl();
export const siteName = "Autograph Exchange";
export const siteTitle = "Autograph Exchange Digital Keepsake App for Schools and Communities";
export const siteDescription =
  "Autograph Exchange is a reusable digital autograph book for schools, events, and communities to collect thoughtful messages, signatures, and keepsakes online.";
export const organizationName = "ForeverLotus";
export const organizationUrl = "https://foreverlotus.com";
export const authorName = "Aarti Sri Ravikumar";
export const authorUrl = "https://aartisr.foreverlotus.com";
export const organizationId = `${organizationUrl}/#organization`;
export const websiteId = `${siteUrl}/#website`;
export const webAppId = `${siteUrl}/#webapp`;
export const personId = `${authorUrl}/#person`;

export const siteKeywords = [
  "digital autograph book",
  "autograph exchange",
  "event keepsakes",
  "school memories",
  "digital signatures",
  "memory messages",
  "community keepsakes",
  "student autographs",
  "teacher appreciation",
];

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}

function pageId(path: string) {
  return `${absoluteUrl(path)}#webpage`;
}

function breadcrumbId(path: string) {
  return `${absoluteUrl(path)}#breadcrumb`;
}

function fitMetaDescription(value: string) {
  if (value.length <= 175) {
    return value;
  }

  return `${value.slice(0, 172).replace(/\s+\S*$/, "").trim()}.`;
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  imagePath = "/opengraph-image",
  imageAlt = `${title} social preview`,
}: PageMetadataOptions): Metadata {
  const canonicalUrl = absoluteUrl(path);

  return {
    title,
    description,
    keywords: [...siteKeywords, ...keywords],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      bingbot: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: imagePath,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imagePath],
    },
  };
}

export function buildNoIndexMetadata(options: PageMetadataOptions): Metadata {
  return {
    ...buildPageMetadata(options),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": 0,
      },
    },
    other: {
      bingbot: "noindex, nofollow",
    },
  };
}

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: organizationName,
      url: organizationUrl,
      founder: {
        "@id": personId,
      },
      logo: absoluteUrl("/autograph-icon.svg"),
    },
    {
      "@type": "Person",
      "@id": personId,
      name: authorName,
      url: authorUrl,
      worksFor: {
        "@id": organizationId,
      },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteName,
      alternateName: ["Autograph Exchange", "Autograph Exchange by ForeverLotus"],
      url: siteUrl,
      description: siteDescription,
      inLanguage: "en-US",
      creator: {
        "@id": personId,
      },
      publisher: {
        "@id": organizationId,
      },
    },
    {
      "@type": "WebApplication",
      "@id": webAppId,
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      applicationCategory: "SocialNetworkingApplication",
      operatingSystem: "Web",
      inLanguage: "en-US",
      isAccessibleForFree: true,
      creator: {
        "@id": personId,
      },
      publisher: {
        "@id": organizationId,
      },
      image: absoluteUrl("/opengraph-image"),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Digital autograph requests",
        "Replies with personal messages",
        "Reusable event keepsake experience",
        "Browser-based access without app installs",
      ],
    },
    {
      "@type": "WebPage",
      "@id": pageId("/"),
      url: absoluteUrl("/"),
      name: siteTitle,
      description: siteDescription,
      isPartOf: {
        "@id": websiteId,
      },
      about: siteKeywords.map((keyword) => ({
        "@type": "Thing",
        name: keyword,
      })),
      breadcrumb: {
        "@id": breadcrumbId("/"),
      },
    },
    {
      "@type": "CollectionPage",
      "@id": pageId("/profiles"),
      url: absoluteUrl("/profiles"),
      name: "Autograph Exchange Profiles for Teachers and Students",
      description:
        "Browse teacher and student profiles in Autograph Exchange, discover focus areas, and open a profile to request a meaningful autograph.",
      isPartOf: {
        "@id": websiteId,
      },
      breadcrumb: {
        "@id": breadcrumbId("/profiles"),
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId("/"),
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: siteName,
          item: absoluteUrl("/"),
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId("/profiles"),
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: siteName,
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Profiles",
          item: absoluteUrl("/profiles"),
        },
      ],
    },
  ],
};

export function buildAutographProfileDescription(profile: {
  displayName: string;
  role: string;
  headline?: string;
  bio?: string;
  subjects?: string[];
  interests?: string[];
}) {
  const topics = [...(profile.subjects ?? []), ...(profile.interests ?? [])].slice(0, 3);
  const topicText = topics.length ? ` with interests in ${topics.join(", ")}` : "";
  const visibleSummary = profile.bio?.trim() || profile.headline?.trim();

  if (visibleSummary && visibleSummary.length >= 110 && visibleSummary.length <= 170) {
    return visibleSummary;
  }

  return fitMetaDescription(
    `${profile.displayName} is a ${profile.role} on Autograph Exchange${topicText}. View this public profile to understand their focus and request a meaningful digital autograph keepsake.`,
  );
}

export function buildProfilePageJsonLd(profile: {
  id: string;
  displayName: string;
  role: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  affiliation?: string;
  location?: string;
  subjects?: string[];
  interests?: string[];
  signaturePrompt?: string;
  updatedAt: string;
}) {
  const path = `/profiles/${encodeURIComponent(profile.id)}`;
  const description = buildAutographProfileDescription(profile);
  const topics = [...(profile.subjects ?? []), ...(profile.interests ?? [])];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": pageId(path),
        url: absoluteUrl(path),
        name: `${profile.displayName} Autograph Profile`,
        description,
        dateModified: profile.updatedAt,
        isPartOf: {
          "@id": websiteId,
        },
        breadcrumb: {
          "@id": breadcrumbId(path),
        },
        mainEntity: {
          "@id": `${absoluteUrl(path)}#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${absoluteUrl(path)}#person`,
        name: profile.displayName,
        description,
        image: profile.avatarUrl ? absoluteUrl(profile.avatarUrl) : undefined,
        affiliation: profile.affiliation
          ? {
              "@type": "Organization",
              name: profile.affiliation,
            }
          : undefined,
        homeLocation: profile.location
          ? {
              "@type": "Place",
              name: profile.location,
            }
          : undefined,
        knowsAbout: topics.length ? topics : undefined,
        additionalType: profile.role,
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId(path),
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteName,
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Profiles",
            item: absoluteUrl("/profiles"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: profile.displayName,
            item: absoluteUrl(path),
          },
        ],
      },
    ],
  };
}
