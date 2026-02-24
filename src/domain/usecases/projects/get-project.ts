import type { Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";

export async function getProjectUseCase(
  repo: ProjectRepository,
  id: string,
): Promise<Project | null> {
  return repo.getById(id);
}
