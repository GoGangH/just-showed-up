function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getConfiguredSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return siteUrl ? normalizeSiteUrl(siteUrl) : null;
}

export function getRequestOrigin(headersList: Pick<Headers, "get">) {
  const configuredSiteUrl = getConfiguredSiteUrl();
  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host") ?? "127.0.0.1:3000";
  const forwardedProto = headersList.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");

  return `${protocol}://${host}`;
}
