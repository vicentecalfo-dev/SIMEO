import { describe, expect, it } from "vitest";
import { round } from "@/lib/math";

describe("round", () => {
  it("arredonda corretamente valores decimais positivos e negativos", () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(10.2349, 3)).toBe(10.235);
    expect(round(-1.005, 2)).toBe(-1.01);
  });
});
