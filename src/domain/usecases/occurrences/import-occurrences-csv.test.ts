import { describe, expect, it } from "vitest";
import {
  mapRowsToOccurrences,
  parseCsvText,
  type CsvMapping,
} from "@/domain/usecases/occurrences/import-occurrences-csv";

const defaultMapping: CsvMapping = {
  latColumn: "latitude",
  lonColumn: "longitude",
  labelColumn: "label",
};

describe("import-occurrences-csv", () => {
  it("CSV com lat/lon válidos gera contagem correta", () => {
    const rows = [
      { latitude: "-22.9", longitude: "-43.2", label: "A" },
      { latitude: "-23.5", longitude: "-46.6", label: "B" },
    ];

    const result = mapRowsToOccurrences(rows, defaultMapping);

    expect(result.stats.rows).toBe(2);
    expect(result.stats.valid).toBe(2);
    expect(result.stats.invalid).toBe(0);
    expect(result.imported).toHaveLength(2);
  });

  it("CSV com vírgula decimal converte corretamente", () => {
    const rows = [{ latitude: " -22,9000 ", longitude: " -43,2000 ", label: "A" }];

    const result = mapRowsToOccurrences(rows, defaultMapping);

    expect(result.imported[0]?.lat).toBe(-22.9);
    expect(result.imported[0]?.lon).toBe(-43.2);
  });

  it("CSV com (0,0) conta em zeroZero e invalid", () => {
    const rows = [{ latitude: "0", longitude: "0", label: "Origem" }];

    const result = mapRowsToOccurrences(rows, defaultMapping);

    expect(result.stats.valid).toBe(0);
    expect(result.stats.invalid).toBe(1);
    expect(result.stats.zeroZero).toBe(1);
    expect(result.invalidRows[0]?.reason).toBe("zero-zero");
  });

  it("deduplicação remove repetidos", () => {
    const rows = [
      { latitude: "-22.9", longitude: "-43.2", label: "A" },
      { latitude: "-22.90000001", longitude: "-43.20000001", label: "A" },
      { latitude: "-22.9", longitude: "-43.2", label: "B" },
    ];

    const result = mapRowsToOccurrences(rows, defaultMapping);

    expect(result.stats.valid).toBe(2);
    expect(result.stats.deduped).toBe(1);
  });

  it("parseCsvText lê headers e linhas", async () => {
    const csv = "latitude,longitude,label\n-22.9,-43.2,A\n-23.5,-46.6,B\n";

    const parsed = await parseCsvText(csv);

    expect(parsed.headers).toEqual(["latitude", "longitude", "label"]);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]?.label).toBe("A");
  });
});
