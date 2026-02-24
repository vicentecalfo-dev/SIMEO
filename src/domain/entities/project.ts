export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
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
  };
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
  };
}
