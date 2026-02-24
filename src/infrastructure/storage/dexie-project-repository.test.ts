import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/domain/entities/project";
import { createDexieDb, type SimeoDexieDb } from "@/infrastructure/storage/dexie-db";
import { DexieProjectRepository } from "@/infrastructure/storage/dexie-project-repository";

function projectFixture(data: Partial<Project> = {}): Project {
  const now = data.updatedAt ?? Date.now();

  return {
    id: data.id ?? `p-${Math.random().toString(16).slice(2)}`,
    name: data.name ?? "Projeto",
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  };
}

describe("DexieProjectRepository", () => {
  let db: SimeoDexieDb;
  let repository: DexieProjectRepository;

  beforeEach(() => {
    db = createDexieDb(`simeo-db-test-${Date.now()}-${Math.random()}`);
    repository = new DexieProjectRepository(db);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    db.close();
    await db.delete();
  });

  it("create + getById retorna o projeto", async () => {
    const project = projectFixture({ id: "proj-1", name: "Projeto A" });

    await repository.create(project);

    await expect(repository.getById("proj-1")).resolves.toEqual(project);
  });

  it("listSummaries ordena por updatedAt desc", async () => {
    const oldProject = projectFixture({
      id: "proj-old",
      name: "Antigo",
      createdAt: 10,
      updatedAt: 20,
    });
    const newProject = projectFixture({
      id: "proj-new",
      name: "Novo",
      createdAt: 11,
      updatedAt: 30,
    });

    await repository.create(oldProject);
    await repository.create(newProject);

    const summaries = await repository.listSummaries();

    expect(summaries.map((item) => item.id)).toEqual(["proj-new", "proj-old"]);
  });

  it("rename altera name e updatedAt", async () => {
    const project = projectFixture({ id: "proj-rename", updatedAt: 100 });
    await repository.create(project);

    vi.spyOn(Date, "now").mockReturnValue(999);

    await repository.rename("proj-rename", "Projeto Renomeado");
    const renamed = await repository.getById("proj-rename");

    expect(renamed?.name).toBe("Projeto Renomeado");
    expect(renamed?.updatedAt).toBe(999);
  });

  it("delete remove o projeto", async () => {
    const project = projectFixture({ id: "proj-delete" });
    await repository.create(project);

    await repository.delete("proj-delete");

    await expect(repository.getById("proj-delete")).resolves.toBeNull();
  });

  it("duplicate cria novo com novo id e name newName", async () => {
    const source = projectFixture({ id: "proj-src", name: "Original" });
    await repository.create(source);

    vi.spyOn(Date, "now").mockReturnValue(777);

    const duplicated = await repository.duplicate("proj-src", "Cópia 1");

    expect(duplicated.id).not.toBe("proj-src");
    expect(duplicated.name).toBe("Cópia 1");
    expect(duplicated.createdAt).toBe(777);
    expect(duplicated.updatedAt).toBe(777);

    const persisted = await repository.getById(duplicated.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.name).toBe("Cópia 1");
  });
});
