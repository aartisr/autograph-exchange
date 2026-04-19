const FALLBACK_SITE_URL = "https://autograph.foreverlotus.com";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return normalizeUrl(explicit);
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) {
    return normalizeUrl(`https://${vercelProduction}`);
  }

  const vercelPreview = process.env.VERCEL_URL;
  if (vercelPreview) {
    return normalizeUrl(`https://${vercelPreview}`);
  }

  return FALLBACK_SITE_URL;
}
