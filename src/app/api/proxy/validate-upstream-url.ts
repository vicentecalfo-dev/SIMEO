export const ALLOWLIST_PREFIXES = [
  "https://storage.googleapis.com/mapbiomas-public/",
] as const;

export function validateUpstreamUrl(raw: string): URL {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("url inválida");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("url inválida");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("url inválida");
  }

  if (parsed.username || parsed.password) {
    throw new Error("url inválida");
  }

  const allowed = ALLOWLIST_PREFIXES.some((prefix) => parsed.href.startsWith(prefix));
  if (!allowed) {
    throw new Error("url não permitida");
  }

  return parsed;
}
