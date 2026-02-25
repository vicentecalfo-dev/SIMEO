import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { selectOccurrencesForCompute } from "@/domain/usecases/occurrences/select-occurrences-for-compute";

describe("selectOccurrencesForCompute", () => {
  it("inclui apenas ocorrências enabled e válidas", () => {
    const occurrences: Occurrence[] = [
      { id: "a", lat: -10, lon: -50, calcStatus: "enabled" },
      { id: "b", lat: -11, lon: -51, calcStatus: "disabled" },
      { id: "c", lat: 999, lon: 999, calcStatus: "enabled" },
      { id: "d", lat: -12, lon: -52 },
    ];

    const selected = selectOccurrencesForCompute(occurrences);

    expect(selected.map((occurrence) => occurrence.id)).toEqual(["a", "d"]);
  });
});
