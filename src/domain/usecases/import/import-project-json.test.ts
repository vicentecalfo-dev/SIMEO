import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Project } from "@/domain/entities/project";
import { exportProjectJson } from "@/domain/usecases/export/export-project-json";
import { importProjectJson } from "@/domain/usecases/import/import-project-json";
import { createDexieDb, type SimeoDexieDb } from "@/infrastructure/storage/dexie-db";
import { DexieProjectRepository } from "@/infrastructure/storage/dexie-project-repository";

function projectFixture(data: Partial<Project> = {}): Project {
  return {
    id: data.id ?? "proj-1",
    name: data.name ?? "Projeto Base",
    createdAt: data.createdAt ?? 100,
    updatedAt: data.updatedAt ?? 100,
    settings: data.settings ?? {
      aooCellSizeMeters: 2000,
    },
    occurrences: data.occurrences ?? [{ id: "occ-1", lat: -10, lon: -50 }],
    results: data.results,
  };
}

describe("importProjectJson", () => {
  let db: SimeoDexieDb;
  let repository: DexieProjectRepository;

  beforeEach(() => {
    db = createDexieDb(`simeo-db-import-test-${Date.now()}-${Math.random()}`);
    repository = new DexieProjectRepository(db);
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it("importa projeto quando id ainda não existe", async () => {
    const source = projectFixture({ id: "proj-free", name: "Projeto Livre" });
    const payload = exportProjectJson(source);

    const imported = await importProjectJson(repository, payload);

    expect(imported.id).toBe("proj-free");
    expect(imported.name).toBe("Projeto Livre");
    expect((await repository.getById("proj-free"))?.name).toBe("Projeto Livre");
  });

  it("gera novo id quando já existe projeto com mesmo id", async () => {
    const existing = projectFixture({ id: "proj-dup", name: "Original" });
    await repository.create(existing);

    const payload = exportProjectJson(projectFixture({ id: "proj-dup", name: "Importado" }));
    const imported = await importProjectJson(repository, payload);

    expect(imported.id).not.toBe("proj-dup");
    expect(imported.name).toBe("Importado - Importado");

    const summaries = await repository.listSummaries();
    expect(summaries).toHaveLength(2);
  });
});
