import type { Project } from "@/domain/entities/project";
import { hashOccurrencesForAOO } from "@/domain/usecases/hash/hash-occurrences-for-aoo";

export function isAooStale(project: Project): boolean {
  const lastAoo = project.results?.aoo;

  if (!lastAoo) {
    return true;
  }

  const currentHash = hashOccurrencesForAOO(
    project.occurrences,
    project.settings.aooCellSizeMeters,
  );

  return currentHash !== lastAoo.inputHash;
}
