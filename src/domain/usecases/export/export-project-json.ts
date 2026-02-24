import type { Project } from "@/domain/entities/project";
import { APP_INFO } from "@/lib/app-info";

export type SimeoExport = {
  schemaVersion: 1;
  exportedAt: number;
  app: {
    name: "SIMEO";
    version: string;
  };
  project: Project;
};

export function exportProjectJson(project: Project): SimeoExport {
  return {
    schemaVersion: 1,
    exportedAt: Date.now(),
    app: {
      name: APP_INFO.name,
      version: APP_INFO.version,
    },
    project: JSON.parse(JSON.stringify(project)) as Project,
  };
}
