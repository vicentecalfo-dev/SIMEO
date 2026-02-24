import type { ProjectRepository } from "@/domain/ports/project-repository";
import { validateProjectName } from "@/domain/usecases/projects/validate-project-name";

export async function renameProjectUseCase(
  repo: ProjectRepository,
  id: string,
  name: string,
): Promise<void> {
  const normalizedName = validateProjectName(name);
  await repo.rename(id, normalizedName);
}
