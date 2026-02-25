import { describe, expect, it } from "vitest";
import {
  ALLOWLIST_PREFIXES,
  validateUpstreamUrl,
} from "@/app/api/proxy/validate-upstream-url";

describe("validateUpstreamUrl", () => {
  it("aceita URL https da allowlist", () => {
    const parsed = validateUpstreamUrl(
      `${ALLOWLIST_PREFIXES[0]}collection/file.tif?x=1`,
    );

    expect(parsed.href).toBe(
      "https://storage.googleapis.com/mapbiomas-public/collection/file.tif?x=1",
    );
  });

  it("rejeita vazio, esquema não-https e user:pass", () => {
    expect(() => validateUpstreamUrl("")).toThrow();
    expect(() =>
      validateUpstreamUrl("http://storage.googleapis.com/mapbiomas-public/a.tif"),
    ).toThrow();
    expect(() =>
      validateUpstreamUrl("https://user:pass@storage.googleapis.com/mapbiomas-public/a.tif"),
    ).toThrow();
  });

  it("rejeita URL fora da allowlist", () => {
    expect(() => validateUpstreamUrl("https://example.com/file.tif")).toThrow();
    expect(() =>
      validateUpstreamUrl("https://storage.googleapis.com/another-bucket/file.tif"),
    ).toThrow();
  });
});
