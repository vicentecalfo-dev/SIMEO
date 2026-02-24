import { touchProject, type Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { validateProjectName } from "@/domain/usecases/projects/validate-project-name";

export async function updateProject(
  repo: ProjectRepository,
  project: Project,
): Promise<Project> {
  const normalizedName = validateProjectName(project.name);
  const touched = touchProject({
    ...project,
    name: normalizedName,
  });

  await repo.update(touched);

  return touched;
}
