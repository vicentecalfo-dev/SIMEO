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
      { id: "a", lat: 0, lon: 0 },
      { id: "b", lat: 0, lon: 1 },
      { id: "c", lat: 1, lon: 0 },
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
      { id: "a", lat: 0, lon: 0 },
      { id: "b", lat: 0, lon: 0.0001 },
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
});
