import { describe, expect, it, vi } from "vitest";
import type { Project, ProjectSummary } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { createWorkspaceStore } from "@/state/workspace.store";

class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  async listSummaries(): Promise<ProjectSummary[]> {
    return [...this.projects.values()].map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  async getById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async create(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async update(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async rename(id: string, name: string): Promise<void> {
    const existing = this.projects.get(id);

    if (!existing) {
      throw new Error("projeto não encontrado");
    }

    this.projects.set(id, {
      ...existing,
      name,
      updatedAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async duplicate(id: string, newName: string): Promise<Project> {
    const source = this.projects.get(id);

    if (!source) {
      throw new Error("projeto não encontrado");
    }

    const now = Date.now();
    const duplicated: Project = {
      ...source,
      id: `dup-${Math.random().toString(16).slice(2)}`,
      name: newName,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...source.settings,
      },
      occurrences: [...source.occurrences],
    };

    this.projects.set(duplicated.id, duplicated);
    return duplicated;
  }
}

function projectFixture(id = "p-1"): Project {
  return {
    id,
    name: "Projeto Workspace",
    createdAt: 100,
    updatedAt: 100,
    settings: {
      aooCellSizeMeters: 2000,
    },
    occurrences: [],
  };
}

async function waitForCondition(
  condition: () => boolean,
  timeoutMs = 2_000,
): Promise<void> {
  const startedAt = Date.now();

  while (!condition()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("timeout aguardando condição no teste");
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
}

describe("workspace.store", () => {
  it("loadProject carrega corretamente", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);

    await useWorkspaceStore.getState().loadProject(project.id);

    expect(useWorkspaceStore.getState().project?.id).toBe(project.id);
    expect(useWorkspaceStore.getState().isDirty).toBe(false);
    expect(useWorkspaceStore.getState().isLoading).toBe(false);
  });

  it("setProject marca dirty", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    useWorkspaceStore.getState().setProject({ name: "Novo Nome" });

    expect(useWorkspaceStore.getState().project?.name).toBe("Novo Nome");
    expect(useWorkspaceStore.getState().isDirty).toBe(true);
  });

  it("saveProject limpa dirty", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);
    useWorkspaceStore.getState().setProject({ name: "Projeto Atualizado" });

    vi.spyOn(Date, "now").mockReturnValue(999);

    await useWorkspaceStore.getState().saveProject();

    expect(useWorkspaceStore.getState().isDirty).toBe(false);
    expect(useWorkspaceStore.getState().project?.updatedAt).toBe(999);
    expect((await repo.getById(project.id))?.name).toBe("Projeto Atualizado");

    vi.restoreAllMocks();
  });

  it("computeEOO atualiza results.eoo e marca dirty", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    project.occurrences = [
      { id: "a", lat: -10, lon: -50 },
      { id: "b", lat: -10, lon: -49 },
      { id: "c", lat: -9, lon: -50 },
    ];
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    vi.spyOn(Date, "now").mockReturnValue(333);

    await useWorkspaceStore.getState().computeEOO();

    expect(useWorkspaceStore.getState().isDirty).toBe(true);
    expect(useWorkspaceStore.getState().project?.results?.eoo).toBeDefined();
    expect(useWorkspaceStore.getState().project?.results?.eoo?.computedAt).toBe(333);
    expect(useWorkspaceStore.getState().project?.results?.eoo?.areaKm2).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it("computeAOO atualiza results.aoo e marca dirty", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    project.occurrences = [
      { id: "a", lat: -10, lon: -50 },
      { id: "b", lat: -10, lon: -50.0001 },
    ];
    project.settings.aooCellSizeMeters = 2000;
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    vi.spyOn(Date, "now").mockReturnValue(444);

    await useWorkspaceStore.getState().computeAOO();

    expect(useWorkspaceStore.getState().isDirty).toBe(true);
    expect(useWorkspaceStore.getState().project?.results?.aoo).toBeDefined();
    expect(useWorkspaceStore.getState().project?.results?.aoo?.computedAt).toBe(444);
    expect(useWorkspaceStore.getState().project?.results?.aoo?.cellSizeMeters).toBe(2000);
    expect(useWorkspaceStore.getState().project?.results?.aoo?.cellCount).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it("add/update/delete occurrence alteram lista e marcam dirty", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    useWorkspaceStore.getState().addOccurrence({
      id: "manual-1",
      lat: -10,
      lon: -50,
      source: "manual",
      calcStatus: "enabled",
    });

    expect(useWorkspaceStore.getState().project?.occurrences).toHaveLength(1);
    expect(useWorkspaceStore.getState().isDirty).toBe(true);

    useWorkspaceStore.getState().updateOccurrence("manual-1", {
      calcStatus: "disabled",
      label: "Editado",
    });

    expect(useWorkspaceStore.getState().project?.occurrences[0]?.calcStatus).toBe(
      "disabled",
    );
    expect(useWorkspaceStore.getState().project?.occurrences[0]?.label).toBe("Editado");

    useWorkspaceStore.getState().deleteOccurrence("manual-1");
    expect(useWorkspaceStore.getState().project?.occurrences).toHaveLength(0);
  });

  it("toggle calcStatus dispara recálculo automático de EOO/AOO", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    project.occurrences = [
      { id: "a", lat: -10, lon: -50, calcStatus: "enabled" },
      { id: "b", lat: -10, lon: -49.99, calcStatus: "enabled" },
      { id: "c", lat: -9.99, lon: -50, calcStatus: "enabled" },
    ];
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);
    await useWorkspaceStore.getState().computeEOO();
    await useWorkspaceStore.getState().computeAOO();

    useWorkspaceStore.getState().updateOccurrence("c", { calcStatus: "disabled" });

    await waitForCondition(() => {
      const state = useWorkspaceStore.getState();
      return (
        state.isComputingEOO === false &&
        state.isComputingAOO === false &&
        state.project?.results?.eoo?.pointsUsed === 2 &&
        state.project?.results?.aoo?.pointsUsed === 2
      );
    });

    const state = useWorkspaceStore.getState();
    expect(state.project?.results?.eoo?.pointsUsed).toBe(2);
    expect(state.project?.results?.aoo?.pointsUsed).toBe(2);
  });

  it("setMapBiomasConfig atualiza config e marca dirty", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    useWorkspaceStore.getState().setMapBiomasConfig({
      targetShape: "AOO",
      naturalClasses: [11, 12],
      samplingStep: 8,
    });

    const state = useWorkspaceStore.getState();
    expect(state.project?.mapbiomas?.config).toEqual({
      targetShape: "AOO",
      naturalClasses: [11, 12],
      samplingStep: 8,
    });
    expect(state.isDirty).toBe(true);
  });

  it("addMapBiomasDatasetFromFile adiciona metadado de arquivo sem raster", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    vi.spyOn(Date, "now").mockReturnValue(123);

    useWorkspaceStore.getState().addMapBiomasDatasetFromFile({
      year: 2023,
      fileName: "mapbiomas-2023.tif",
      label: "Colecao 2023",
    });

    const dataset = useWorkspaceStore.getState().project?.mapbiomas?.datasets[0];
    expect(dataset?.sourceType).toBe("file");
    expect(dataset?.year).toBe(2023);
    expect(dataset?.addedAt).toBe(123);
    expect(dataset?.id).toBeTruthy();
    expect(dataset?.label).toBe("Colecao 2023");
    if (dataset?.sourceType === "file") {
      expect(dataset.fileName).toBe("mapbiomas-2023.tif");
    }
    expect(useWorkspaceStore.getState().isDirty).toBe(true);

    vi.restoreAllMocks();
  });

  it("addMapBiomasDatasetFromUrl adiciona metadado de URL crua", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);

    vi.spyOn(Date, "now").mockReturnValue(456);

    useWorkspaceStore.getState().addMapBiomasDatasetFromUrl({
      year: 2022,
      url: "https://storage.googleapis.com/mapbiomas-public/2022.tif",
    });

    const dataset = useWorkspaceStore.getState().project?.mapbiomas?.datasets[0];
    expect(dataset?.sourceType).toBe("url");
    expect(dataset?.year).toBe(2022);
    expect(dataset?.addedAt).toBe(456);
    expect(dataset?.id).toBeTruthy();
    if (dataset?.sourceType === "url") {
      expect(dataset.url).toBe("https://storage.googleapis.com/mapbiomas-public/2022.tif");
    }

    vi.restoreAllMocks();
  });

  it("removeMapBiomasDataset remove dataset por id", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    project.mapbiomas = {
      config: {
        targetShape: "EOO",
        naturalClasses: [1, 3],
        samplingStep: 4,
      },
      datasets: [
        {
          id: "d-file",
          sourceType: "file",
          year: 2020,
          fileName: "a.tif",
          addedAt: 10,
        },
        {
          id: "d-url",
          sourceType: "url",
          year: 2021,
          url: "https://storage.googleapis.com/mapbiomas-public/b.tif",
          addedAt: 11,
        },
      ],
    };
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);
    useWorkspaceStore.getState().removeMapBiomasDataset("d-file");

    const datasets = useWorkspaceStore.getState().project?.mapbiomas?.datasets ?? [];
    expect(datasets).toHaveLength(1);
    expect(datasets[0]?.id).toBe("d-url");
    expect(useWorkspaceStore.getState().isDirty).toBe(true);
  });

  it("clearMapBiomasResults remove resultados mantendo config/datasets", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();
    project.mapbiomas = {
      config: {
        targetShape: "EOO",
        naturalClasses: [1, 3],
        samplingStep: 4,
      },
      datasets: [
        {
          id: "d-1",
          sourceType: "file",
          year: 2020,
          fileName: "raster.tif",
          addedAt: 10,
        },
      ],
      results: {
        byYear: [
          {
            year: 2020,
            naturalPercent: 45,
            totalPixels: 100,
            naturalPixels: 45,
          },
        ],
        generatedAt: 11,
      },
    };
    await repo.create(project);

    const useWorkspaceStore = createWorkspaceStore(repo);
    await useWorkspaceStore.getState().loadProject(project.id);
    useWorkspaceStore.getState().clearMapBiomasResults();

    const state = useWorkspaceStore.getState();
    expect(state.project?.mapbiomas?.results).toBeUndefined();
    expect(state.project?.mapbiomas?.datasets).toHaveLength(1);
    expect(state.isDirty).toBe(true);
  });
});
