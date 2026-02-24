import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import { exportOccurrencesCsv } from "@/domain/usecases/export/export-occurrences-csv";

describe("exportOccurrencesCsv", () => {
  it("exporta apenas ocorrências válidas e não zero-zero com header", () => {
    const occurrences: Occurrence[] = [
      { id: "ok-1", label: "A", lat: -10.5, lon: -50.25, source: "csv" },
      { id: "inv", label: "Inv", lat: 999, lon: 0 },
      { id: "zero", label: "Zero", lat: 0, lon: 0 },
      { id: "ok-2", label: "B", lat: -11, lon: -51, source: "json" },
    ];

    const csv = exportOccurrencesCsv(occurrences);
    const lines = csv.split("\n");

    expect(lines[0]).toBe("id,label,lat,lon,source");
    expect(lines).toHaveLength(3);
    expect(csv).toContain("ok-1,A,-10.5,-50.25,csv");
    expect(csv).toContain("ok-2,B,-11,-51,json");
    expect(csv).not.toContain("inv");
    expect(csv).not.toContain("zero");
  });

  it("escapa campos com vírgula e aspas", () => {
    const occurrences: Occurrence[] = [
      { id: "id,1", label: "Nome \"X\"", lat: -10, lon: -50, source: "s" },
    ];

    const csv = exportOccurrencesCsv(occurrences);

    expect(csv).toContain('"id,1","Nome ""X""",-10,-50,s');
  });
});
