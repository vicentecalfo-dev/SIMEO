import { describe, expect, it } from "vitest";
import { validateLatLon } from "@/domain/value-objects/latlon";

describe("validateLatLon", () => {
  it("aceita coordenadas nos extremos validos", () => {
    expect(validateLatLon(-90, -180)).toEqual({ ok: true });
    expect(validateLatLon(90, 180)).toEqual({ ok: true });
  });

  it("rejeita latitude fora do intervalo", () => {
    expect(validateLatLon(90.0001, 0)).toEqual({
      ok: false,
      reason: "lat-out-of-range",
    });
    expect(validateLatLon(-90.1, 0)).toEqual({
      ok: false,
      reason: "lat-out-of-range",
    });
  });

  it("rejeita longitude fora do intervalo", () => {
    expect(validateLatLon(0, 180.0001)).toEqual({
      ok: false,
      reason: "lon-out-of-range",
    });
    expect(validateLatLon(0, -180.5)).toEqual({
      ok: false,
      reason: "lon-out-of-range",
    });
  });

  it("rejeita NaN e Infinity", () => {
    expect(validateLatLon(Number.NaN, 10)).toEqual({
      ok: false,
      reason: "not-finite",
    });
    expect(validateLatLon(10, Number.POSITIVE_INFINITY)).toEqual({
      ok: false,
      reason: "not-finite",
    });
  });

  it('rejeita (0,0) com reason "zero-zero"', () => {
    expect(validateLatLon(0, 0)).toEqual({
      ok: false,
      reason: "zero-zero",
    });
  });
});
