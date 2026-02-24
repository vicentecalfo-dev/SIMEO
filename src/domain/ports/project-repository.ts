import type { Project, ProjectSummary } from "@/domain/entities/project";

export interface ProjectRepository {
  listSummaries(): Promise<ProjectSummary[]>;
  getById(id: string): Promise<Project | null>;
  create(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string, newName: string): Promise<Project>;
}
