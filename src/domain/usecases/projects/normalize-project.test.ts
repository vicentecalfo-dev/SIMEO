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
    expect(normalized.settings.mapLayers?.order).toEqual([
      "occurrences",
      "eoo",
      "aoo",
    ]);
    expect(normalized.settings.mapLayers?.visibility).toEqual({
      occurrences: true,
      eoo: true,
      aoo: true,
    });
    expect(normalized.mapbiomas).toEqual({
      config: {
        targetShape: "EOO",
        naturalClasses: [1, 3, 4, 5],
        samplingStep: 4,
      },
      datasets: [],
      results: undefined,
    });
    expect(Array.isArray(normalized.occurrences)).toBe(true);
    expect(normalized.occurrences).toHaveLength(0);
  });

  it("normaliza order/visibility de mapLayers", () => {
    const project = {
      id: "proj-4",
      name: "Projeto map",
      createdAt: 100,
      updatedAt: 100,
      settings: {
        aooCellSizeMeters: 2000,
        mapLayers: {
          order: ["eoo", "eoo", "occurrences"],
          visibility: {
            occurrences: false,
          },
        },
      },
      occurrences: [],
    } as unknown as Project;

    const normalized = normalizeProject(project);

    expect(normalized.settings.mapLayers?.order).toEqual(["eoo", "occurrences", "aoo"]);
    expect(normalized.settings.mapLayers?.visibility).toEqual({
      occurrences: false,
      eoo: true,
      aoo: true,
    });
  });

  it("normaliza mapbiomas com defaults quando dados inválidos", () => {
    const project = {
      id: "proj-5",
      name: "Projeto MB",
      createdAt: 100,
      updatedAt: 100,
      settings: {
        aooCellSizeMeters: 2000,
      },
      occurrences: [],
      mapbiomas: {
        config: {
          targetShape: "INVALID",
          naturalClasses: ["x", 3, 3, -1],
          samplingStep: 123,
        },
        datasets: [
          {
            id: "d-1",
            sourceType: "url",
            year: 2020,
            url: "https://storage.googleapis.com/mapbiomas-public/a.tif",
            addedAt: 111,
          },
          {
            id: "d-legacy",
            year: 2021,
            fileName: "legacy.tif",
            addedAt: 222,
          },
          {
            id: "",
            year: "x",
            fileName: "",
            addedAt: 0,
          },
        ],
      },
    } as unknown as Project;

    const normalized = normalizeProject(project);

    expect(normalized.mapbiomas?.config).toEqual({
      targetShape: "EOO",
      naturalClasses: [3],
      samplingStep: 4,
    });
    expect(normalized.mapbiomas?.datasets).toHaveLength(2);
    expect(normalized.mapbiomas?.datasets[0]).toEqual({
      id: "d-1",
      sourceType: "url",
      year: 2020,
      url: "https://storage.googleapis.com/mapbiomas-public/a.tif",
      addedAt: 111,
    });
    expect(normalized.mapbiomas?.datasets[1]).toEqual({
      id: "d-legacy",
      sourceType: "file",
      year: 2021,
      fileName: "legacy.tif",
      addedAt: 222,
    });
  });

  it("normaliza dataset legado sem sourceType como arquivo", () => {
    const project = {
      id: "proj-6",
      name: "Projeto MB legado",
      createdAt: 100,
      updatedAt: 100,
      settings: {
        aooCellSizeMeters: 2000,
      },
      occurrences: [],
      mapbiomas: {
        config: {
          targetShape: "EOO",
          naturalClasses: [1, 3],
          samplingStep: 4,
        },
        datasets: [
          {
            id: "legacy-1",
            year: 2019,
            fileName: "mb-2019.tif",
            addedAt: 77,
          },
        ],
      },
    } as unknown as Project;

    const normalized = normalizeProject(project);

    expect(normalized.mapbiomas?.datasets[0]).toEqual({
      id: "legacy-1",
      sourceType: "file",
      year: 2019,
      fileName: "mb-2019.tif",
      addedAt: 77,
    });
  });
});
