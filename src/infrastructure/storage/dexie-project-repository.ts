import {
  generateProjectId,
  type Project,
  type ProjectSummary,
  withProjectDefaults,
} from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { createDexieDb, type SimeoDexieDb } from "@/infrastructure/storage/dexie-db";

export class DexieProjectRepository implements ProjectRepository {
  constructor(private readonly db: SimeoDexieDb) {}

  async listSummaries(): Promise<ProjectSummary[]> {
    const projects = await this.db.projects.orderBy("updatedAt").reverse().toArray();

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
    }));
  }

  async getById(id: string): Promise<Project | null> {
    const project = await this.db.projects.get(id);
    return project ? withProjectDefaults(project) : null;
  }

  async create(project: Project): Promise<void> {
    await this.db.projects.add(withProjectDefaults(project));
  }

  async update(project: Project): Promise<void> {
    await this.db.projects.put(withProjectDefaults(project));
  }

  async rename(id: string, name: string): Promise<void> {
    const existing = await this.db.projects.get(id);

    if (!existing) {
      throw new Error("projeto não encontrado");
    }

    const baseProject = withProjectDefaults(existing);

    await this.db.projects.put({
      ...baseProject,
      name,
      updatedAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.projects.delete(id);
  }

  async duplicate(id: string, newName: string): Promise<Project> {
    const existing = await this.db.projects.get(id);

    if (!existing) {
      throw new Error("projeto não encontrado");
    }

    const baseProject = withProjectDefaults(existing);
    const now = Date.now();
    const duplicated: Project = {
      ...baseProject,
      id: generateProjectId(),
      name: newName,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...baseProject.settings,
      },
      occurrences: [...baseProject.occurrences],
      results: baseProject.results
        ? {
            ...baseProject.results,
            eoo: baseProject.results.eoo
              ? {
                  ...baseProject.results.eoo,
                  hull: baseProject.results.eoo.hull
                    ? JSON.parse(JSON.stringify(baseProject.results.eoo.hull))
                    : null,
                }
              : undefined,
            aoo: baseProject.results.aoo
              ? {
                  ...baseProject.results.aoo,
                  grid: JSON.parse(JSON.stringify(baseProject.results.aoo.grid)),
                }
              : undefined,
          }
        : undefined,
    };

    await this.db.projects.add(duplicated);

    return duplicated;
  }
}

let browserRepository: ProjectRepository | null = null;

export function createProjectRepository(): ProjectRepository {
  if (typeof window === "undefined") {
    throw new Error("ProjectRepository só pode ser usado no navegador.");
  }

  if (!browserRepository) {
    browserRepository = new DexieProjectRepository(createDexieDb("simeo-db"));
  }

  return browserRepository;
}
