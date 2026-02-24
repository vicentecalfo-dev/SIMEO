"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/state/workspace.store";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(timestamp);
}

export default function WorkspaceProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const project = useWorkspaceStore((state) => state.project);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const error = useWorkspaceStore((state) => state.error);
  const isDirty = useWorkspaceStore((state) => state.isDirty);
  const loadProject = useWorkspaceStore((state) => state.loadProject);
  const setProject = useWorkspaceStore((state) => state.setProject);
  const saveProject = useWorkspaceStore((state) => state.saveProject);

  useEffect(() => {
    void loadProject(projectId).catch(() => undefined);
  }, [loadProject, projectId]);

  useEffect(() => {
    if (!isDirty || Boolean(error)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveProject().catch(() => undefined);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [error, isDirty, project?.name, project?.settings.aooCellSizeMeters, saveProject]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Carregando projeto...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro: {error}
        </p>
        <Link
          href="/projects"
          className="inline-flex w-fit rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Voltar para Projetos
        </Link>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Projeto não encontrado
        </h1>
        <p className="text-sm text-slate-600">
          Não foi possível encontrar um projeto com o ID informado.
        </p>
        <Link
          href="/projects"
          className="inline-flex w-fit rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Voltar para Projetos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Workspace do Projeto
        </h1>
        <Link
          href="/projects"
          className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Voltar para Projetos
        </Link>
      </header>

      <section className="grid flex-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Projeto</h2>

          <div className="space-y-1">
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-slate-700"
            >
              Nome
            </label>
            <input
              id="project-name"
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
              value={project.name}
              onChange={(event) => setProject({ name: event.target.value })}
              maxLength={120}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="aoo-cell-size"
              className="text-sm font-medium text-slate-700"
            >
              Tamanho da célula AOO (m)
            </label>
            <input
              id="aoo-cell-size"
              type="number"
              min={1}
              step={100}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
              value={project.settings.aooCellSizeMeters}
              onChange={(event) => {
                const nextValue = Number(event.target.value);

                if (Number.isFinite(nextValue) && nextValue > 0) {
                  setProject({
                    settings: {
                      aooCellSizeMeters: nextValue,
                    },
                  });
                }
              }}
            />
          </div>

          <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-800">Criado em:</span>{" "}
              {formatDate(project.createdAt)}
            </p>
            <p>
              <span className="font-medium text-slate-800">Atualizado em:</span>{" "}
              {formatDate(project.updatedAt)}
            </p>
            <p>
              <span className="font-medium text-slate-800">ID:</span> {project.id}
            </p>
          </div>

          <p
            className={`text-sm font-medium ${
              isDirty ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {isDirty ? "Salvando..." : "Salvo"}
          </p>
        </aside>

        <section className="flex min-h-[26rem] flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Área principal</h2>
          <p className="text-sm text-slate-600">
            Mapa será implementado no próximo marco
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-medium">Ocorrências:</span> {project.occurrences.length}
          </p>
        </section>
      </section>
    </main>
  );
}
