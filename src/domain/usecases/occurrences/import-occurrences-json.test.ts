import { describe, expect, it } from "vitest";
import { importOccurrencesFromJson } from "@/domain/usecases/occurrences/import-occurrences-json";

describe("import-occurrences-json", () => {
  it("array simples válido importa", () => {
    const input = [
      { lat: -22.9, lon: -43.2, label: "A" },
      { lat: -23.5, lon: -46.6, label: "B" },
    ];

    const result = importOccurrencesFromJson(input);

    expect(result.stats.rows).toBe(2);
    expect(result.stats.valid).toBe(2);
    expect(result.imported).toHaveLength(2);
  });

  it("ignora inválidos", () => {
    const input = [
      { lat: -22.9, lon: -43.2, label: "A" },
      { lat: 0, lon: 0, label: "Origem" },
      { lat: 95, lon: -43.2, label: "Fora" },
    ];

    const result = importOccurrencesFromJson(input);

    expect(result.stats.rows).toBe(3);
    expect(result.stats.valid).toBe(1);
    expect(result.stats.invalid).toBe(2);
    expect(result.stats.zeroZero).toBe(1);
  });
});
