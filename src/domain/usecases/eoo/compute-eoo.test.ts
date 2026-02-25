import { describe, expect, it, vi } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { computeEOO } from "@/domain/usecases/eoo/compute-eoo";

function occ(id: string, lat: number, lon: number, label?: string): Occurrence {
  return {
    id,
    lat,
    lon,
    label,
    calcStatus: "enabled",
  };
}

function expectFinitePositive(value: number): void {
  expect(Number.isFinite(value)).toBe(true);
  expect(Number.isNaN(value)).toBe(false);
  expect(value).toBeGreaterThan(0);
}

describe("computeEOO", () => {
  it("retorna hull null e area zero para 0, 1 e 2 pontos válidos", () => {
    const empty = computeEOO({ occurrences: [] });
    expect(empty.hull).toBeNull();
    expect(empty.areaKm2).toBe(0);
    expect(empty.pointsUsed).toBe(0);

    const onePoint = computeEOO({
      occurrences: [occ("a", -10, -50)],
    });
    expect(onePoint.hull).toBeNull();
    expect(onePoint.areaKm2).toBe(0);
    expect(onePoint.pointsUsed).toBe(1);

    const twoPoints = computeEOO({
      occurrences: [occ("a", -10, -50), occ("b", -11, -51)],
    });
    expect(twoPoints.hull).toBeNull();
    expect(twoPoints.areaKm2).toBe(0);
    expect(twoPoints.pointsUsed).toBe(2);
  });

  it("gera convex hull e área positiva para triângulo", () => {
    vi.spyOn(Date, "now").mockReturnValue(123456789);

    const result = computeEOO({
      occurrences: [occ("a", -10, -50), occ("b", -10, -49), occ("c", -9, -50)],
    });

    expect(result.hull).not.toBeNull();
    expect(result.hull?.geometry.type).toBe("Polygon");
    expectFinitePositive(result.areaKm2);
    expect(result.computedAt).toBe(123456789);
    expect(result.inputHash.length > 0).toBe(true);

    // Aproximação geodésica para triângulo de 1°x1° próximo ao Equador.
    const expectedKm2 = 6182;
    const tolerance = expectedKm2 * 0.2;
    expect(Math.abs(result.areaKm2 - expectedKm2)).toBeLessThanOrEqual(tolerance);

    vi.restoreAllMocks();
  });

  it("gera área consistente para quadrado e ignora pontos inválidos", () => {
    const result = computeEOO({
      occurrences: [
        occ("a", -10, -50),
        occ("b", -10, -49),
        occ("c", -9, -49),
        occ("d", -9, -50),
        occ("inv", 1000, 0),
      ],
    });

    expect(result.hull).not.toBeNull();
    expect(result.pointsUsed).toBe(4);
    expectFinitePositive(result.areaKm2);

    const expectedKm2 = 12364;
    const tolerance = expectedKm2 * 0.2;
    expect(Math.abs(result.areaKm2 - expectedKm2)).toBeLessThanOrEqual(tolerance);
  });

  it("ignora pontos desabilitados no cálculo", () => {
    const result = computeEOO({
      occurrences: [
        occ("a", -10, -50),
        occ("b", -10, -49),
        occ("c", -9, -50),
        {
          ...occ("d", 10, 10),
          calcStatus: "disabled",
        },
      ],
    });

    expect(result.pointsUsed).toBe(3);
    expect(result.hull).not.toBeNull();
  });
});
