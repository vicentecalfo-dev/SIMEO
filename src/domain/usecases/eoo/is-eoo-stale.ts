import type { Project } from "@/domain/entities/project";
import { hashOccurrencesForEOO } from "@/domain/usecases/hash/hash-occurrences-for-eoo";

export function isEooStale(project: Project): boolean {
  const lastEoo = project.results?.eoo;

  if (!lastEoo) {
    return true;
  }

  const currentHash = hashOccurrencesForEOO(project.occurrences);
  return currentHash !== lastEoo.inputHash;
}
