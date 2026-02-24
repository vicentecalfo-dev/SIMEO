import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { computeBounds } from "@/ui/components/map/bounds";

function occurrenceFixture(data: Partial<Occurrence>): Occurrence {
  return {
    id: data.id ?? `occ-${Math.random().toString(16).slice(2)}`,
    lat: data.lat ?? -22.9,
    lon: data.lon ?? -43.2,
    label: data.label,
    source: data.source,
    raw: data.raw,
  };
}

describe("computeBounds", () => {
  it("retorna null sem ocorrências válidas", () => {
    const bounds = computeBounds([
      occurrenceFixture({ lat: 0, lon: 0 }),
      occurrenceFixture({ lat: 95, lon: 10 }),
    ]);

    expect(bounds).toBeNull();
  });

  it("calcula bounds corretamente", () => {
    const bounds = computeBounds([
      occurrenceFixture({ lat: -10, lon: -50 }),
      occurrenceFixture({ lat: -20, lon: -40 }),
      occurrenceFixture({ lat: -15, lon: -60 }),
    ]);

    expect(bounds).toEqual({
      southWest: [-20, -60],
      northEast: [-10, -40],
    });
  });

  it("ignora inválidas e usa somente válidas", () => {
    const bounds = computeBounds([
      occurrenceFixture({ lat: -10, lon: -50 }),
      occurrenceFixture({ lat: 0, lon: 0 }),
      occurrenceFixture({ lat: -12, lon: -52 }),
    ]);

    expect(bounds).toEqual({
      southWest: [-12, -52],
      northEast: [-10, -50],
    });
  });
});
