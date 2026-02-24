import { create } from "zustand";
import type { Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { getProjectUseCase } from "@/domain/usecases/projects/get-project";
import { updateProject } from "@/domain/usecases/projects/update-project";
import { geoComputeService } from "@/infrastructure/geo/geo-compute-service";
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
  isComputingEOO: boolean;
  isComputingAOO: boolean;
  computeError?: string;
  loadProject: (id: string) => Promise<void>;
  setProject: (partialUpdate: Partial<Project>) => void;
  computeAOO: () => Promise<void>;
  computeEOO: () => Promise<void>;
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
      isComputingEOO: false,
      isComputingAOO: false,
      computeError: undefined,
      async loadProject(id: string) {
        set({
          isLoading: true,
          error: undefined,
          computeError: undefined,
          isComputingEOO: false,
          isComputingAOO: false,
        });

        try {
          const project = await getProjectUseCase(resolveRepo(), id);
          set({
            project,
            isLoading: false,
            isDirty: false,
            computeError: undefined,
          });
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
            results:
              partialUpdate.results !== undefined
                ? {
                    ...state.project.results,
                    ...partialUpdate.results,
                  }
                : state.project.results,
            assessment:
              partialUpdate.assessment !== undefined
                ? {
                    ...state.project.assessment,
                    ...partialUpdate.assessment,
                    iucnB:
                      partialUpdate.assessment.iucnB !== undefined
                        ? {
                            ...state.project.assessment?.iucnB,
                            ...partialUpdate.assessment.iucnB,
                            continuingDecline:
                              partialUpdate.assessment.iucnB.continuingDecline !== undefined
                                ? {
                                    ...state.project.assessment?.iucnB?.continuingDecline,
                                    ...partialUpdate.assessment.iucnB.continuingDecline,
                                  }
                                : state.project.assessment?.iucnB?.continuingDecline,
                            extremeFluctuations:
                              partialUpdate.assessment.iucnB.extremeFluctuations !== undefined
                                ? {
                                    ...state.project.assessment?.iucnB?.extremeFluctuations,
                                    ...partialUpdate.assessment.iucnB.extremeFluctuations,
                                  }
                                : state.project.assessment?.iucnB?.extremeFluctuations,
                          }
                        : state.project.assessment?.iucnB,
                  }
                : state.project.assessment,
          };

          return {
            project: nextProject,
            isDirty: true,
            error: undefined,
            computeError: undefined,
          };
        });
      },
      async computeEOO() {
        const current = get().project;

        if (!current) {
          return;
        }

        set({ isComputingEOO: true, computeError: undefined });

        try {
          const eooResult = await geoComputeService.computeEOO(current.occurrences);

          set((state) => {
            if (!state.project || state.project.id !== current.id) {
              return state;
            }

            return {
              project: {
                ...state.project,
                results: {
                  ...state.project.results,
                  eoo: eooResult,
                },
              },
              isDirty: true,
              error: undefined,
              computeError: undefined,
            };
          });
        } catch (error) {
          set({
            computeError: `Falha ao calcular EOO: ${toErrorMessage(error)}`,
          });
          throw error;
        } finally {
          set({ isComputingEOO: false });
        }
      },
      async computeAOO() {
        const current = get().project;

        if (!current) {
          return;
        }

        set({ isComputingAOO: true, computeError: undefined });

        try {
          const aooResult = await geoComputeService.computeAOO(
            current.occurrences,
            current.settings.aooCellSizeMeters,
          );

          set((state) => {
            if (!state.project || state.project.id !== current.id) {
              return state;
            }

            return {
              project: {
                ...state.project,
                results: {
                  ...state.project.results,
                  aoo: aooResult,
                },
              },
              isDirty: true,
              error: undefined,
              computeError: undefined,
            };
          });
        } catch (error) {
          set({
            computeError: `Falha ao calcular AOO: ${toErrorMessage(error)}`,
          });
          throw error;
        } finally {
          set({ isComputingAOO: false });
        }
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
