import { create } from "zustand";
import { normalizeCalcStatus } from "@/domain/entities/occurrence";
import type { Project } from "@/domain/entities/project";
import type { ProjectRepository } from "@/domain/ports/project-repository";
import { hashOccurrencesForAOO } from "@/domain/usecases/hash/hash-occurrences-for-aoo";
import { hashOccurrencesForEOO } from "@/domain/usecases/hash/hash-occurrences-for-eoo";
import {
  addOccurrenceToList,
  deleteOccurrenceById,
  updateOccurrenceById,
} from "@/domain/usecases/occurrences/curate-occurrences";
import { getProjectUseCase } from "@/domain/usecases/projects/get-project";
import { normalizeProject } from "@/domain/usecases/projects/normalize-project";
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
  addOccurrence: (occurrence: Project["occurrences"][number]) => void;
  updateOccurrence: (
    id: string,
    patch: Partial<Project["occurrences"][number]>,
  ) => void;
  deleteOccurrence: (id: string) => void;
  computeAOO: () => Promise<void>;
  computeEOO: () => Promise<void>;
  saveProject: () => Promise<void>;
  resetDirty: () => void;
}

export const createWorkspaceStore = (injectedRepo?: ProjectRepository) =>
  create<WorkspaceState>((set, get) => {
    let repo = injectedRepo;
    let autoRecomputePending = false;
    let autoRecomputeRunning = false;

    const resolveRepo = (): ProjectRepository => {
      if (!repo) {
        repo = createProjectRepository();
      }

      return repo;
    };

    const runAutoRecomputeLoop = async (): Promise<void> => {
      if (autoRecomputeRunning) {
        return;
      }

      autoRecomputeRunning = true;

      try {
        while (autoRecomputePending) {
          autoRecomputePending = false;
          const state = get();

          if (!state.project) {
            continue;
          }

          try {
            await state.computeEOO();
          } catch {
            // erro já exposto em computeError
          }

          try {
            await state.computeAOO();
          } catch {
            // erro já exposto em computeError
          }
        }
      } finally {
        autoRecomputeRunning = false;
      }
    };

    const scheduleAutoRecompute = (): void => {
      if (!get().project) {
        return;
      }

      autoRecomputePending = true;
      void runAutoRecomputeLoop();
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
          const normalizedProject = project ? normalizeProject(project) : null;
          set({
            project: normalizedProject,
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
              ? partialUpdate.occurrences.map((occurrence) => ({
                  ...occurrence,
                  calcStatus: normalizeCalcStatus(occurrence.calcStatus),
                }))
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
      addOccurrence(occurrence) {
        set((state) => {
          if (!state.project) {
            return state;
          }

          return {
            project: {
              ...state.project,
              occurrences: addOccurrenceToList(state.project.occurrences, {
                ...occurrence,
                calcStatus: normalizeCalcStatus(occurrence.calcStatus),
              }),
            },
            isDirty: true,
            error: undefined,
            computeError: undefined,
          };
        });

        scheduleAutoRecompute();
      },
      updateOccurrence(id, patch) {
        const shouldRecompute =
          patch.lat !== undefined ||
          patch.lon !== undefined ||
          patch.calcStatus !== undefined;

        set((state) => {
          if (!state.project) {
            return state;
          }

          return {
            project: {
              ...state.project,
              occurrences: updateOccurrenceById(state.project.occurrences, id, {
                ...patch,
                calcStatus:
                  patch.calcStatus !== undefined
                    ? normalizeCalcStatus(patch.calcStatus)
                    : undefined,
              }),
            },
            isDirty: true,
            error: undefined,
            computeError: undefined,
          };
        });

        if (shouldRecompute) {
          scheduleAutoRecompute();
        }
      },
      deleteOccurrence(id) {
        set((state) => {
          if (!state.project) {
            return state;
          }

          return {
            project: {
              ...state.project,
              occurrences: deleteOccurrenceById(state.project.occurrences, id),
            },
            isDirty: true,
            error: undefined,
            computeError: undefined,
          };
        });

        scheduleAutoRecompute();
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

            const currentInputHash = hashOccurrencesForEOO(state.project.occurrences);

            if (currentInputHash !== eooResult.inputHash) {
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

            const currentInputHash = hashOccurrencesForAOO(
              state.project.occurrences,
              state.project.settings.aooCellSizeMeters,
            );

            if (currentInputHash !== aooResult.inputHash) {
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
