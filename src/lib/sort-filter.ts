import type { ProjectSummary } from "@/domain/entities/project";

export type ProjectSortMode = "updated_desc" | "name_asc" | "created_desc";

export function filterProjects(
  projects: ProjectSummary[],
  query: string,
): ProjectSummary[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...projects];
  }

  return projects.filter((project) =>
    project.name.toLowerCase().includes(normalizedQuery),
  );
}

export function sortProjects(
  projects: ProjectSummary[],
  mode: ProjectSortMode,
): ProjectSummary[] {
  const copy = [...projects];

  copy.sort((left, right) => {
    if (mode === "updated_desc") {
      return right.updatedAt - left.updatedAt;
    }

    if (mode === "created_desc") {
      return right.createdAt - left.createdAt;
    }

    return left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
  });

  return copy;
}
