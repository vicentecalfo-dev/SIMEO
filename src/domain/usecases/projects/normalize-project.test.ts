import { describe, expect, it } from "vitest";
import type { Project } from "@/domain/entities/project";
import { normalizeProject } from "@/domain/usecases/projects/normalize-project";

describe("normalizeProject", () => {
  it("define calcStatus=enabled em ocorrências legadas", () => {
    const legacy = {
      id: "proj-1",
      name: "Projeto legado",
      createdAt: 100,
      updatedAt: 100,
      settings: {
        aooCellSizeMeters: 2000,
      },
      occurrences: [
        { id: "a", lat: -10, lon: -50 },
        { id: "b", lat: -11, lon: -51, calcStatus: "disabled" },
      ],
    } as Project;

    const normalized = normalizeProject(legacy);

    expect(normalized.occurrences[0]?.calcStatus).toBe("enabled");
    expect(normalized.occurrences[1]?.calcStatus).toBe("disabled");
  });

  it("não muta o objeto original", () => {
    const original = {
      id: "proj-2",
      name: "Projeto",
      createdAt: 100,
      updatedAt: 100,
      settings: {
        aooCellSizeMeters: 2000,
      },
      occurrences: [{ id: "a", lat: -10, lon: -50 }],
    } as Project;

    const normalized = normalizeProject(original);

    expect(original.occurrences[0]?.calcStatus).toBeUndefined();
    expect(normalized.occurrences[0]?.calcStatus).toBe("enabled");
  });

  it("garante defaults mínimos de settings e occurrences", () => {
    const broken = {
      id: "proj-3",
      name: "Projeto quebrado",
      createdAt: 100,
      updatedAt: 100,
    } as Project;

    const normalized = normalizeProject(broken);

    expect(normalized.settings.aooCellSizeMeters).toBeGreaterThan(0);
    expect(Array.isArray(normalized.occurrences)).toBe(true);
    expect(normalized.occurrences).toHaveLength(0);
  });
});
