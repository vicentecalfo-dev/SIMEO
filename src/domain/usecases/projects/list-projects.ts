import type { ProjectSummary } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";

export async function listProjectsUseCase(
  repo: ProjectRepository,
): Promise<ProjectSummary[]> {
  return repo.listSummaries();
}
