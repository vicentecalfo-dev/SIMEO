export function isValidMapBiomasTiffUrl(url: string): boolean {
  if (typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();

  if (!trimmed.startsWith("https://")) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.toLowerCase();

    return path.endsWith(".tif") || path.endsWith(".tiff");
  } catch {
    return false;
  }
}
