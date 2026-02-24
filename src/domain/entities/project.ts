import type { Occurrence } from "@/domain/entities/occurrence";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: {
    aooCellSizeMeters: number;
  };
  occurrences: Occurrence[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
}

function randomIdFallback(): string {
  return `proj-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const DEFAULT_AOO_CELL_SIZE_METERS = 2000;

export function generateProjectId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return randomIdFallback();
}

export function newProject(name: string): Project {
  const now = Date.now();

  return {
    id: generateProjectId(),
    name,
    createdAt: now,
    updatedAt: now,
    settings: {
      aooCellSizeMeters: DEFAULT_AOO_CELL_SIZE_METERS,
    },
    occurrences: [],
  };
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
  };
}

export function withProjectDefaults(project: Project): Project {
  const maybeProject = project as Project & {
    settings?: { aooCellSizeMeters?: number };
    occurrences?: Occurrence[];
  };

  return {
    ...project,
    settings: {
      aooCellSizeMeters: Number.isFinite(maybeProject.settings?.aooCellSizeMeters)
        ? Number(maybeProject.settings?.aooCellSizeMeters)
        : DEFAULT_AOO_CELL_SIZE_METERS,
    },
    occurrences: Array.isArray(maybeProject.occurrences)
      ? maybeProject.occurrences.map((occurrence) => ({ ...occurrence }))
      : [],
  };
}
