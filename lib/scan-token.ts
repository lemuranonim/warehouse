export function parseScanToken(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return "";

  let candidate = trimmed;
  try {
    const url = new URL(trimmed);
    candidate = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    candidate = trimmed.split(/[/?#]/).filter(Boolean).at(-1) ?? "";
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return "";
  }

  return candidate.trim().toUpperCase();
}
