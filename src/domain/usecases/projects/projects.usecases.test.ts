import { describe, expect, it, vi } from "vitest";
import type { Project, ProjectSummary } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { createProjectUseCase } from "@/domain/usecases/projects/create-project";
import { deleteProjectUseCase } from "@/domain/usecases/projects/delete-project";
import { duplicateProjectUseCase } from "@/domain/usecases/projects/duplicate-project";
import { getProjectUseCase } from "@/domain/usecases/projects/get-project";
import { listProjectsUseCase } from "@/domain/usecases/projects/list-projects";
import { renameProjectUseCase } from "@/domain/usecases/projects/rename-project";

class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  async listSummaries(): Promise<ProjectSummary[]> {
    return [...this.projects.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((project) => ({
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
    };

    this.projects.set(duplicated.id, duplicated);
    return duplicated;
  }
}

describe("project usecases", () => {
  it("create/list/rename/delete funciona com validações", async () => {
    const repo = new InMemoryProjectRepository();

    vi.spyOn(Date, "now").mockReturnValue(1000);
    const created = await createProjectUseCase(repo, "   Projeto Base   ");

    expect(created.name).toBe("Projeto Base");

    let list = await listProjectsUseCase(repo);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(created.id);

    vi.spyOn(Date, "now").mockReturnValue(2000);
    await renameProjectUseCase(repo, created.id, "Projeto Renomeado");

    const updated = await getProjectUseCase(repo, created.id);
    expect(updated?.name).toBe("Projeto Renomeado");
    expect(updated?.updatedAt).toBe(2000);

    await deleteProjectUseCase(repo, created.id);

    list = await listProjectsUseCase(repo);
    expect(list).toHaveLength(0);

    vi.restoreAllMocks();
  });

  it("create falha com nome inválido", async () => {
    const repo = new InMemoryProjectRepository();

    await expect(createProjectUseCase(repo, "  ")).rejects.toThrow("nome inválido");
    await expect(createProjectUseCase(repo, "ab")).rejects.toThrow("nome inválido");
  });

  it("duplicate cria uma cópia com novo id", async () => {
    const repo = new InMemoryProjectRepository();

    const created = await createProjectUseCase(repo, "Projeto Original");
    const duplicated = await duplicateProjectUseCase(repo, created.id, "Cópia de Projeto");

    expect(duplicated.id).not.toBe(created.id);
    expect(duplicated.name).toBe("Cópia de Projeto");

    const list = await listProjectsUseCase(repo);
    expect(list).toHaveLength(2);
  });
});
