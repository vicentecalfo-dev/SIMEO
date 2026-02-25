import Papa from "papaparse";
import {
  DEFAULT_OCCURRENCE_CALC_STATUS,
  generateOccurrenceId,
  normalizeOccurrence,
  type Occurrence,
} from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { dedupeOccurrences } from "@/domain/usecases/occurrences/clean-occurrences";

export type CsvMapping = {
  latColumn: string;
  lonColumn: string;
  idColumn?: string;
  labelColumn?: string;
};

export type ImportCsvResult = {
  imported: Occurrence[];
  stats: {
    rows: number;
    valid: number;
    invalid: number;
    zeroZero: number;
    deduped: number;
  };
  invalidRows: Array<{ index: number; reason: string }>;
};

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

function normalizeText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).trim();
}

export function parseCoordinate(value: unknown): number {
  const normalized = normalizeText(value)
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

  if (normalized.length === 0) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function parseCsvText(text: string): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0]?.message ?? "falha ao ler csv"));
          return;
        }

        const headers = (result.meta.fields ?? []).map((field) => field.trim());
        const rows = result.data.map((row) => {
          const normalizedRow: Record<string, string> = {};

          for (const header of headers) {
            normalizedRow[header] = normalizeText(row[header]);
          }

          return normalizedRow;
        });

        resolve({ headers, rows });
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

export async function parseCsv(file: File): Promise<ParsedCsv> {
  const text = await file.text();
  return parseCsvText(text);
}

export function mapRowsToOccurrences(
  rows: Record<string, string>[],
  mapping: CsvMapping,
): ImportCsvResult {
  const invalidRows: Array<{ index: number; reason: string }> = [];
  const candidates: Occurrence[] = [];

  let invalid = 0;
  let zeroZero = 0;

  rows.forEach((row, index) => {
    const lat = parseCoordinate(row[mapping.latColumn]);
    const lon = parseCoordinate(row[mapping.lonColumn]);

    const validation = validateLatLon(lat, lon);
    if (!validation.ok) {
      invalid += 1;
      if (validation.reason === "zero-zero") {
        zeroZero += 1;
      }

      invalidRows.push({
        index: index + 1,
        reason: validation.reason,
      });
      return;
    }

    const labelValue = mapping.labelColumn ? normalizeText(row[mapping.labelColumn]) : "";
    const idValue = mapping.idColumn ? normalizeText(row[mapping.idColumn]) : "";

    const occurrence = normalizeOccurrence({
      id: idValue.length > 0 ? idValue : generateOccurrenceId(),
      lat,
      lon,
      label: labelValue.length > 0 ? labelValue : undefined,
      source: "csv",
      raw: row,
      calcStatus: DEFAULT_OCCURRENCE_CALC_STATUS,
    });

    if (!occurrence) {
      invalid += 1;
      invalidRows.push({
        index: index + 1,
        reason: "invalid-occurrence",
      });
      return;
    }

    candidates.push(occurrence);
  });

  const deduped = dedupeOccurrences(candidates);

  return {
    imported: deduped.kept,
    stats: {
      rows: rows.length,
      valid: deduped.kept.length,
      invalid,
      zeroZero,
      deduped: deduped.removedCount,
    },
    invalidRows,
  };
}
