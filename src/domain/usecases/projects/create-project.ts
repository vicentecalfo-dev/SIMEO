import { newProject, type Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { validateProjectName } from "@/domain/usecases/projects/validate-project-name";

export async function createProjectUseCase(
  repo: ProjectRepository,
  name: string,
): Promise<Project> {
  const normalizedName = validateProjectName(name);
  const project = newProject(normalizedName);

  await repo.create(project);

  return project;
}
