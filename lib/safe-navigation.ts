const LOCAL_ORIGIN = "https://warehouse.local";

export function safeInternalPath(value: unknown) {
  if (typeof value !== "string") return "/";
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "/";

  try {
    const url = new URL(candidate, LOCAL_ORIGIN);
    const decodedPath = decodeURIComponent(url.pathname);
    if (url.origin !== LOCAL_ORIGIN || decodedPath.startsWith("//") || decodedPath.includes("\\")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
