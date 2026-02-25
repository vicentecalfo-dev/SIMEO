import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import {
  addOccurrenceToList,
  deleteOccurrenceById,
  toggleOccurrenceCalcStatusById,
  updateOccurrenceById,
} from "@/domain/usecases/occurrences/curate-occurrences";

const base: Occurrence[] = [
  { id: "a", lat: -10, lon: -50, calcStatus: "enabled" },
  { id: "b", lat: -11, lon: -51, calcStatus: "enabled" },
];

describe("curate-occurrences", () => {
  it("addOccurrenceToList adiciona no final", () => {
    const next = addOccurrenceToList(base, {
      id: "c",
      lat: -12,
      lon: -52,
      calcStatus: "enabled",
    });

    expect(next).toHaveLength(3);
    expect(next[2]?.id).toBe("c");
  });

  it("updateOccurrenceById atualiza campos sem alterar id", () => {
    const next = updateOccurrenceById(base, "a", {
      id: "outro-id",
      label: "Atualizado",
      calcStatus: "disabled",
    });

    expect(next[0]?.id).toBe("a");
    expect(next[0]?.label).toBe("Atualizado");
    expect(next[0]?.calcStatus).toBe("disabled");
  });

  it("deleteOccurrenceById remove ocorrência", () => {
    const next = deleteOccurrenceById(base, "a");

    expect(next.map((occurrence) => occurrence.id)).toEqual(["b"]);
  });

  it("toggleOccurrenceCalcStatusById alterna enabled/disabled", () => {
    const disabled = toggleOccurrenceCalcStatusById(base, "a");
    expect(disabled[0]?.calcStatus).toBe("disabled");

    const enabledAgain = toggleOccurrenceCalcStatusById(disabled, "a");
    expect(enabledAgain[0]?.calcStatus).toBe("enabled");
  });
});
