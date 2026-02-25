import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { hashOccurrencesForAOO } from "@/domain/usecases/hash/hash-occurrences-for-aoo";

function occ(id: string, lat: number, lon: number, label?: string): Occurrence {
  return {
    id,
    lat,
    lon,
    label,
    calcStatus: "enabled",
  };
}

describe("hashOccurrencesForAOO", () => {
  it("gera hash estável para mesmas ocorrências em ordens diferentes", () => {
    const sampleA: Occurrence[] = [
      occ("1", -10.1234561, -50.2, "B"),
      occ("2", -10.1234569, -50.2000001, "A"),
      occ("3", -11, -49, "C"),
    ];

    const sampleB: Occurrence[] = [sampleA[2]!, sampleA[0]!, sampleA[1]!];

    expect(hashOccurrencesForAOO(sampleA, 2000)).toBe(hashOccurrencesForAOO(sampleB, 2000));
  });

  it("muda hash quando cellSizeMeters muda", () => {
    const sample: Occurrence[] = [occ("1", -10.1, -50.2, "P1")];

    expect(hashOccurrencesForAOO(sample, 2000)).not.toBe(hashOccurrencesForAOO(sample, 1000));
  });

  it("muda hash quando ponto muda", () => {
    const base: Occurrence[] = [occ("1", -10.1, -50.2, "P1")];
    const changed: Occurrence[] = [occ("1", -10.1, -50.21, "P1")];

    expect(hashOccurrencesForAOO(base, 2000)).not.toBe(hashOccurrencesForAOO(changed, 2000));
  });

  it("ignora ocorrências inválidas no hash", () => {
    const withInvalid: Occurrence[] = [occ("1", -10.1, -50.2, "P1"), occ("inv", 999, 999, "inv")];
    const onlyValid: Occurrence[] = [occ("1", -10.1, -50.2, "P1")];

    expect(hashOccurrencesForAOO(withInvalid, 2000)).toBe(hashOccurrencesForAOO(onlyValid, 2000));
  });

  it("muda hash quando status de cálculo muda", () => {
    const enabled: Occurrence[] = [occ("1", -10.1, -50.2, "P1"), occ("2", -11.1, -51.2, "P2")];
    const disabledSecond: Occurrence[] = [
      enabled[0]!,
      {
        ...enabled[1]!,
        calcStatus: "disabled",
      },
    ];

    expect(hashOccurrencesForAOO(enabled, 2000)).not.toBe(
      hashOccurrencesForAOO(disabledSecond, 2000),
    );
  });
});
