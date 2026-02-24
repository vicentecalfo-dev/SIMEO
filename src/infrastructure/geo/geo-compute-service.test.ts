import { afterEach, describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { computeAOO } from "@/domain/usecases/aoo/compute-aoo";
import { computeEOO } from "@/domain/usecases/eoo/compute-eoo";
import {
  computeAOOAsync,
  computeEOOAsync,
} from "@/infrastructure/geo/geo-compute-service";

const fixtures: Occurrence[] = [
  { id: "a", lat: 0, lon: 0 },
  { id: "b", lat: 0, lon: 1 },
  { id: "c", lat: 1, lon: 0 },
];

describe("geo-compute-service fallback", () => {
  const originalWorker = globalThis.Worker;

  afterEach(() => {
    Object.defineProperty(globalThis, "Worker", {
      value: originalWorker,
      configurable: true,
      writable: true,
    });
  });

  it("computeEOOAsync usa fallback e mantém formato", async () => {
    Object.defineProperty(globalThis, "Worker", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const asyncResult = await computeEOOAsync(fixtures);
    const directResult = computeEOO({ occurrences: fixtures });

    expect(asyncResult.pointsUsed).toBe(directResult.pointsUsed);
    expect(asyncResult.inputHash).toBe(directResult.inputHash);
    expect(asyncResult.hull?.geometry.type ?? null).toBe(
      directResult.hull?.geometry.type ?? null,
    );
  });

  it("computeAOOAsync usa fallback e mantém formato", async () => {
    Object.defineProperty(globalThis, "Worker", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const asyncResult = await computeAOOAsync(fixtures, 2000);
    const directResult = computeAOO({ occurrences: fixtures, cellSizeMeters: 2000 });

    expect(asyncResult.cellCount).toBe(directResult.cellCount);
    expect(asyncResult.inputHash).toBe(directResult.inputHash);
    expect(asyncResult.grid.features.length).toBe(directResult.grid.features.length);
  });
});
