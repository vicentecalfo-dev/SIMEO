import {
  generateProjectId,
  type Project,
} from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import type { SimeoExport } from "@/domain/usecases/export/export-project-json";
import { normalizeProject } from "@/domain/usecases/projects/normalize-project";

function parseUnknownInput(input: unknown): unknown {
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      throw new Error("JSON inválido");
    }
  }

  return input;
}

function ensureObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new Error(message);
  }

  return value as Record<string, unknown>;
}

function validateProject(projectValue: unknown): Project {
  const project = ensureObject(projectValue, "projeto inválido");
  const settings = ensureObject(project.settings, "settings inválido");

  if (typeof project.id !== "string" || project.id.trim().length === 0) {
    throw new Error("project.id inválido");
  }

  if (typeof project.name !== "string" || project.name.trim().length === 0) {
    throw new Error("project.name inválido");
  }

  if (
    typeof project.createdAt !== "number" ||
    !Number.isFinite(project.createdAt) ||
    typeof project.updatedAt !== "number" ||
    !Number.isFinite(project.updatedAt)
  ) {
    throw new Error("timestamps do projeto inválidos");
  }

  if (
    typeof settings.aooCellSizeMeters !== "number" ||
    !Number.isFinite(settings.aooCellSizeMeters)
  ) {
    throw new Error("settings.aooCellSizeMeters inválido");
  }

  if (!Array.isArray(project.occurrences)) {
    throw new Error("occurrences inválido");
  }

  return normalizeProject(project as Project);
}

function validateSimeoEnvelope(value: unknown): SimeoExport {
  const root = ensureObject(value, "arquivo de projeto inválido");

  if (root.schemaVersion !== 1) {
    throw new Error("schemaVersion não suportado");
  }

  if (typeof root.exportedAt !== "number" || !Number.isFinite(root.exportedAt)) {
    throw new Error("exportedAt inválido");
  }

  const app = ensureObject(root.app, "app inválido");
  if (app.name !== "SIMEO") {
    throw new Error("app.name inválido");
  }

  return {
    schemaVersion: 1,
    exportedAt: Number(root.exportedAt),
    app: {
      name: "SIMEO",
      version: typeof app.version === "string" ? app.version : "",
    },
    project: validateProject(root.project),
  };
}

function buildImportedCopy(project: Project): Project {
  return {
    ...project,
    id: generateProjectId(),
    name: `Importado - ${project.name}`,
  };
}

export async function importProjectJson(
  repo: ProjectRepository,
  input: unknown,
): Promise<Project> {
  const parsedInput = parseUnknownInput(input);
  const envelope = validateSimeoEnvelope(parsedInput);
  const importedProject = normalizeProject(envelope.project);

  const existing = await repo.getById(importedProject.id);
  const targetProject = existing
    ? buildImportedCopy(importedProject)
    : importedProject;

  await repo.create(targetProject);

  return targetProject;
}
