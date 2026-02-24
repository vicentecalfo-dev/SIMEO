import { describe, expect, it } from "vitest";
import type { ProjectSummary } from "@/domain/entities/project";
import { filterProjects, sortProjects } from "@/lib/sort-filter";

const fixtures: ProjectSummary[] = [
  { id: "1", name: "Projeto Zeta", createdAt: 10, updatedAt: 20 },
  { id: "2", name: "Projeto Alfa", createdAt: 30, updatedAt: 15 },
  { id: "3", name: "Mata Atlântica", createdAt: 20, updatedAt: 25 },
];

describe("sort-filter", () => {
  it("filterProjects filtra por nome sem case sensitive", () => {
    const result = filterProjects(fixtures, "projeto");
    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("sortProjects ordena por updated desc", () => {
    const result = sortProjects(fixtures, "updated_desc");
    expect(result.map((item) => item.id)).toEqual(["3", "1", "2"]);
  });

  it("sortProjects ordena por nome asc", () => {
    const result = sortProjects(fixtures, "name_asc");
    expect(result.map((item) => item.id)).toEqual(["2", "3", "1"]);
  });

  it("sortProjects ordena por criado desc", () => {
    const result = sortProjects(fixtures, "created_desc");
    expect(result.map((item) => item.id)).toEqual(["2", "3", "1"]);
  });
});
