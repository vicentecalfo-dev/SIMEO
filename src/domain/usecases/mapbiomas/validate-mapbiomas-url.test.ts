import { describe, expect, it } from "vitest";
import { isValidMapBiomasTiffUrl } from "@/domain/usecases/mapbiomas/validate-mapbiomas-url";

describe("isValidMapBiomasTiffUrl", () => {
  it("aceita URL https terminando em .tif/.tiff", () => {
    expect(
      isValidMapBiomasTiffUrl("https://storage.googleapis.com/mapbiomas-public/a.tif"),
    ).toBe(true);
    expect(
      isValidMapBiomasTiffUrl("https://storage.googleapis.com/mapbiomas-public/a.TIFF?x=1"),
    ).toBe(true);
  });

  it("rejeita URL sem https", () => {
    expect(
      isValidMapBiomasTiffUrl("http://storage.googleapis.com/mapbiomas-public/a.tif"),
    ).toBe(false);
    expect(
      isValidMapBiomasTiffUrl("ftp://storage.googleapis.com/mapbiomas-public/a.tif"),
    ).toBe(false);
  });

  it("rejeita URL que não aponta para tif/tiff", () => {
    expect(
      isValidMapBiomasTiffUrl("https://storage.googleapis.com/mapbiomas-public/a.png"),
    ).toBe(false);
  });

  it("rejeita string inválida", () => {
    expect(isValidMapBiomasTiffUrl("not-a-url")).toBe(false);
  });
});
