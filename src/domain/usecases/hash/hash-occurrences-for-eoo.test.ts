import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { hashOccurrencesForEOO } from "@/domain/usecases/hash/hash-occurrences-for-eoo";

function occ(id: string, lat: number, lon: number, label?: string): Occurrence {
  return {
    id,
    lat,
    lon,
    label,
  };
}

describe("hashOccurrencesForEOO", () => {
  it("gera o mesmo hash para mesma coleção em ordens diferentes", () => {
    const sampleA: Occurrence[] = [
      occ("1", -10.1234561, -50.2, "B"),
      occ("2", -10.1234569, -50.2000001, "A"),
      occ("3", -11, -49, "C"),
    ];

    const sampleB: Occurrence[] = [sampleA[2]!, sampleA[0]!, sampleA[1]!];

    expect(hashOccurrencesForEOO(sampleA)).toBe(hashOccurrencesForEOO(sampleB));
  });

  it("muda hash quando um ponto muda", () => {
    const base: Occurrence[] = [occ("1", -10.1, -50.2, "P1"), occ("2", -11.3, -51.4, "P2")];
    const changed: Occurrence[] = [occ("1", -10.1, -50.2, "P1"), occ("2", -11.3, -51.41, "P2")];

    expect(hashOccurrencesForEOO(base)).not.toBe(hashOccurrencesForEOO(changed));
  });

  it("ignora ocorrências inválidas no hash", () => {
    const withInvalid: Occurrence[] = [occ("1", -10.1, -50.2, "P1"), occ("inv", 999, 999, "inv")];
    const onlyValid: Occurrence[] = [occ("1", -10.1, -50.2, "P1")];

    expect(hashOccurrencesForEOO(withInvalid)).toBe(hashOccurrencesForEOO(onlyValid));
  });
});
