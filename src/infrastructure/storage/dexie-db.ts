import Dexie, { type Table } from "dexie";
import type { Project } from "@/domain/entities/project";

export class SimeoDexieDb extends Dexie {
  projects!: Table<Project, string>;

  constructor(name = "simeo-db") {
    super(name);

    this.version(1).stores({
      projects: "id, updatedAt, createdAt, name",
    });
  }
}

export function createDexieDb(name = "simeo-db"): SimeoDexieDb {
  return new SimeoDexieDb(name);
}
