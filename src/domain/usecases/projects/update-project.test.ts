import { describe, expect, it, vi } from "vitest";
import type { Project, ProjectSummary } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { updateProject } from "@/domain/usecases/projects/update-project";

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
    const existing = this.projects.get(id);

    if (!existing) {
      throw new Error("projeto não encontrado");
    }

    const duplicated: Project = {
      ...existing,
      id: `dup-${Math.random().toString(16).slice(2)}`,
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        ...existing.settings,
      },
      occurrences: [...existing.occurrences],
    };

    this.projects.set(duplicated.id, duplicated);
    return duplicated;
  }
}

function projectFixture(): Project {
  return {
    id: "proj-1",
    name: "Projeto Base",
    createdAt: 100,
    updatedAt: 100,
    settings: {
      aooCellSizeMeters: 2000,
    },
    occurrences: [],
  };
}

describe("updateProject usecase", () => {
  it("altera name", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();

    await repo.create(project);

    vi.spyOn(Date, "now").mockReturnValue(200);

    const updated = await updateProject(repo, {
      ...project,
      name: "  Projeto Renomeado  ",
    });

    expect(updated.name).toBe("Projeto Renomeado");
    expect((await repo.getById(project.id))?.name).toBe("Projeto Renomeado");

    vi.restoreAllMocks();
  });

  it("altera updatedAt", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();

    await repo.create(project);

    vi.spyOn(Date, "now").mockReturnValue(5000);

    const updated = await updateProject(repo, project);

    expect(updated.updatedAt).toBe(5000);
    expect((await repo.getById(project.id))?.updatedAt).toBe(5000);

    vi.restoreAllMocks();
  });

  it("lança erro se nome inválido", async () => {
    const repo = new InMemoryProjectRepository();
    const project = projectFixture();

    await expect(
      updateProject(repo, {
        ...project,
        name: "  ",
      }),
    ).rejects.toThrow("nome inválido");
  });
});
