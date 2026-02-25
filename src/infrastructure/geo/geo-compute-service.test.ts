import { afterEach, describe, expect, it, vi } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { computeAOO } from "@/domain/usecases/aoo/compute-aoo";
import { computeEOO } from "@/domain/usecases/eoo/compute-eoo";
import {
  GeoComputeService,
  serializeOccurrencesForWorker,
} from "@/infrastructure/geo/geo-compute-service";

const fixtures: Occurrence[] = [
  { id: "a", lat: 0, lon: 0, label: "A" },
  { id: "b", lat: 0, lon: 1, label: "B" },
  { id: "c", lat: 1, lon: 0, label: "C" },
];

describe("geo-compute-service fallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("computeEOO usa fallback sem Worker e mantém resultado do usecase", async () => {
    const service = new GeoComputeService({ workerFactory: () => null });
    vi.spyOn(Date, "now").mockReturnValue(171);

    const asyncResult = await service.computeEOO(fixtures);
    const directResult = computeEOO({ occurrences: fixtures });

    expect(asyncResult).toEqual(directResult);
  });

  it("computeAOO usa fallback sem Worker e mantém resultado do usecase", async () => {
    const service = new GeoComputeService({ workerFactory: () => null });
    vi.spyOn(Date, "now").mockReturnValue(172);

    const asyncResult = await service.computeAOO(fixtures, 2000);
    const directResult = computeAOO({ occurrences: fixtures, cellSizeMeters: 2000 });

    expect(asyncResult).toEqual(directResult);
  });

  it("serializa payload para formato simples e sem Map/Set", () => {
    const payload: Occurrence[] = [
      {
        id: "x",
        lat: -12,
        lon: -47,
        label: "Teste",
        raw: {
          metadata: new Map([
            ["fonte", "gbif"],
            ["tags", new Set(["nativa", "ameaçada"])],
          ]),
          nested: [{ key: "ok", values: new Set([1, 2]) }],
        },
      },
    ];

    const serialized = serializeOccurrencesForWorker(payload);

    expect(serialized).toEqual([
      {
        id: "x",
        lat: -12,
        lon: -47,
        label: "Teste",
        calcStatus: "enabled",
        raw: {
          metadata: {
            fonte: "gbif",
            tags: ["nativa", "ameaçada"],
          },
          nested: [{ key: "ok", values: [1, 2] }],
        },
      },
    ]);
    expect(serialized[0]?.raw?.metadata instanceof Map).toBe(false);
  });
});
