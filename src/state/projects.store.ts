import { create } from "zustand";
import type { ProjectSummary } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { createProjectUseCase } from "@/domain/usecases/projects/create-project";
import { deleteProjectUseCase } from "@/domain/usecases/projects/delete-project";
import { duplicateProjectUseCase } from "@/domain/usecases/projects/duplicate-project";
import { listProjectsUseCase } from "@/domain/usecases/projects/list-projects";
import { renameProjectUseCase } from "@/domain/usecases/projects/rename-project";
import { createProjectRepository } from "@/infrastructure/storage/dexie-project-repository";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "erro inesperado";
}

export interface ProjectsState {
  projects: ProjectSummary[];
  isLoading: boolean;
  error?: string;
  loadProjects: () => Promise<void>;
  createProject: (name: string) => Promise<string>;
  renameProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string, newName: string) => Promise<string>;
}

export const createProjectsStore = (injectedRepo?: ProjectRepository) =>
  create<ProjectsState>((set, get) => {
    let repo = injectedRepo;

    const resolveRepo = (): ProjectRepository => {
      if (!repo) {
        repo = createProjectRepository();
      }

      return repo;
    };

    return {
      projects: [],
      isLoading: false,
      error: undefined,
      async loadProjects() {
        set({ isLoading: true, error: undefined });

        try {
          const projects = await listProjectsUseCase(resolveRepo());
          set({ projects, isLoading: false });
        } catch (error) {
          set({ error: toErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      async createProject(name: string) {
        set({ isLoading: true, error: undefined });

        try {
          const created = await createProjectUseCase(resolveRepo(), name);
          await get().loadProjects();
          return created.id;
        } catch (error) {
          set({ error: toErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      async renameProject(id: string, name: string) {
        set({ isLoading: true, error: undefined });

        try {
          await renameProjectUseCase(resolveRepo(), id, name);
          await get().loadProjects();
        } catch (error) {
          set({ error: toErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      async deleteProject(id: string) {
        set({ isLoading: true, error: undefined });

        try {
          await deleteProjectUseCase(resolveRepo(), id);
          await get().loadProjects();
        } catch (error) {
          set({ error: toErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      async duplicateProject(id: string, newName: string) {
        set({ isLoading: true, error: undefined });

        try {
          const duplicated = await duplicateProjectUseCase(resolveRepo(), id, newName);
          await get().loadProjects();
          return duplicated.id;
        } catch (error) {
          set({ error: toErrorMessage(error), isLoading: false });
          throw error;
        }
      },
    };
  });

export const useProjectsStore = createProjectsStore();
