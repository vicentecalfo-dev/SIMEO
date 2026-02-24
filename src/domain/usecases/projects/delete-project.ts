import type { ProjectRepository } from "@/domain/ports/project-repository";

export async function deleteProjectUseCase(
  repo: ProjectRepository,
  id: string,
): Promise<void> {
  await repo.delete(id);
}
