import type { Project } from "@/domain/entities/project";
import {
  normalizeCalcStatus,
  type Occurrence,
} from "@/domain/entities/occurrence";
import { withProjectDefaults } from "@/domain/entities/project";

function normalizeOccurrences(occurrences: Occurrence[]): Occurrence[] {
  return occurrences.map((occurrence) => ({
    ...occurrence,
    calcStatus: normalizeCalcStatus(occurrence.calcStatus),
  }));
}

export function normalizeProject(project: Project): Project {
  const withDefaults = withProjectDefaults(project);

  return {
    ...withDefaults,
    settings: {
      ...withDefaults.settings,
    },
    occurrences: normalizeOccurrences(withDefaults.occurrences),
  };
}
