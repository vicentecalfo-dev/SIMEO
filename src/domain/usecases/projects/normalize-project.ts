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
    mapbiomas: withDefaults.mapbiomas
      ? {
          config: {
            targetShape: withDefaults.mapbiomas.config.targetShape,
            naturalClasses: [...withDefaults.mapbiomas.config.naturalClasses],
            samplingStep: withDefaults.mapbiomas.config.samplingStep,
          },
          datasets: withDefaults.mapbiomas.datasets.map((dataset) => ({
            ...dataset,
          })),
          results: withDefaults.mapbiomas.results
            ? {
                byYear: withDefaults.mapbiomas.results.byYear.map((entry) => ({
                  ...entry,
                })),
                generatedAt: withDefaults.mapbiomas.results.generatedAt,
              }
            : undefined,
        }
      : undefined,
  };
}
