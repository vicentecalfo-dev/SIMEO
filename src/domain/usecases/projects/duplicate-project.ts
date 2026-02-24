import type { Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { validateProjectName } from "@/domain/usecases/projects/validate-project-name";

export async function duplicateProjectUseCase(
  repo: ProjectRepository,
  id: string,
  newName: string,
): Promise<Project> {
  const normalizedName = validateProjectName(newName);
  return repo.duplicate(id, normalizedName);
}
