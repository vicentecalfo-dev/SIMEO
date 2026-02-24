import { create } from "zustand";
import type { Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { getProjectUseCase } from "@/domain/usecases/projects/get-project";
import { updateProject } from "@/domain/usecases/projects/update-project";
import { createProjectRepository } from "@/infrastructure/storage/dexie-project-repository";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "erro inesperado";
}

export interface WorkspaceState {
  project: Project | null;
  isLoading: boolean;
  error?: string;
  isDirty: boolean;
  loadProject: (id: string) => Promise<void>;
  setProject: (partialUpdate: Partial<Project>) => void;
  saveProject: () => Promise<void>;
  resetDirty: () => void;
}

export const createWorkspaceStore = (injectedRepo?: ProjectRepository) =>
  create<WorkspaceState>((set, get) => {
    let repo = injectedRepo;

    const resolveRepo = (): ProjectRepository => {
      if (!repo) {
        repo = createProjectRepository();
      }

      return repo;
    };

    return {
      project: null,
      isLoading: false,
      error: undefined,
      isDirty: false,
      async loadProject(id: string) {
        set({ isLoading: true, error: undefined });

        try {
          const project = await getProjectUseCase(resolveRepo(), id);
          set({ project, isLoading: false, isDirty: false });
        } catch (error) {
          set({ error: toErrorMessage(error), isLoading: false });
          throw error;
        }
      },
      setProject(partialUpdate: Partial<Project>) {
        set((state) => {
          if (!state.project) {
            return state;
          }

          const nextProject: Project = {
            ...state.project,
            ...partialUpdate,
            settings: partialUpdate.settings
              ? {
                  ...state.project.settings,
                  ...partialUpdate.settings,
                }
              : state.project.settings,
            occurrences: partialUpdate.occurrences
              ? [...partialUpdate.occurrences]
              : state.project.occurrences,
          };

          return {
            project: nextProject,
            isDirty: true,
            error: undefined,
          };
        });
      },
      async saveProject() {
        const current = get().project;
        const dirty = get().isDirty;

        if (!current || !dirty) {
          return;
        }

        try {
          const saved = await updateProject(resolveRepo(), current);
          set({ project: saved, isDirty: false, error: undefined });
        } catch (error) {
          set({ error: toErrorMessage(error) });
          throw error;
        }
      },
      resetDirty() {
        set({ isDirty: false });
      },
    };
  });

export const useWorkspaceStore = createWorkspaceStore();
