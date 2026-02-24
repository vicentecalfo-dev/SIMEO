import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/domain/entities/project";
import { exportProjectJson } from "@/domain/usecases/export/export-project-json";

function projectFixture(): Project {
  return {
    id: "proj-1",
    name: "Projeto Teste",
    createdAt: 100,
    updatedAt: 200,
    settings: {
      aooCellSizeMeters: 2000,
    },
    occurrences: [{ id: "occ-1", lat: -10, lon: -50, label: "Ponto" }],
  };
}

describe("exportProjectJson", () => {
  it("gera envelope schemaVersion=1 e inclui project", () => {
    vi.spyOn(Date, "now").mockReturnValue(999);
    const project = projectFixture();

    const exported = exportProjectJson(project);

    expect(exported.schemaVersion).toBe(1);
    expect(exported.exportedAt).toBe(999);
    expect(exported.app.name).toBe("SIMEO");
    expect(exported.project).toEqual(project);

    vi.restoreAllMocks();
  });
});
