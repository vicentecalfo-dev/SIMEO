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
      mapLayers: withDefaults.settings.mapLayers
        ? {
            order: [...withDefaults.settings.mapLayers.order],
            visibility: withDefaults.settings.mapLayers.visibility
              ? { ...withDefaults.settings.mapLayers.visibility }
              : undefined,
          }
        : undefined,
    },
    occurrences: normalizeOccurrences(withDefaults.occurrences),
  };
}
