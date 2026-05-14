export function getSafeRedirectPath(value: FormDataEntryValue | string | null | undefined, fallback = "/") {
  if (typeof value !== "string") {
    return fallback;
  }

  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

export function buildLoginHref(nextPath = "/") {
  const params = new URLSearchParams({ modal: "login" });
  const safeNextPath = getSafeRedirectPath(nextPath);

  if (safeNextPath !== "/") {
    params.set("next", safeNextPath);
  }

  return `/?${params.toString()}`;
}
