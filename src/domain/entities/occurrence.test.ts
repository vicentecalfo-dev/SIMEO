import { describe, expect, it } from "vitest";
import {
  normalizeOccurrence,
  type Occurrence,
} from "@/domain/entities/occurrence";
import { validOccurrenceInput } from "@/test/helpers/fixtures";

describe("normalizeOccurrence", () => {
  it("gera id quando nao informado", () => {
    const normalized = normalizeOccurrence(validOccurrenceInput);

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBeTypeOf("string");
    expect((normalized?.id.length ?? 0) > 0).toBe(true);
  });

  it("mantem id existente quando informado", () => {
    const input: Partial<Occurrence> = {
      ...validOccurrenceInput,
      id: "occ-123",
    };

    const normalized = normalizeOccurrence(input);

    expect(normalized).not.toBeNull();
    expect(normalized?.id).toBe("occ-123");
  });

  it("retorna null para coordenadas invalidas", () => {
    const input: Partial<Occurrence> = {
      lat: 91,
      lon: -46.6333,
    };

    expect(normalizeOccurrence(input)).toBeNull();
  });
});
