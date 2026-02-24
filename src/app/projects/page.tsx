"use client";

import { Button, Card } from "@codeworker.br/govbr-tw-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { importProjectJson } from "@/domain/usecases/import/import-project-json";
import { createProjectRepository } from "@/infrastructure/storage/dexie-project-repository";
import {
  filterProjects,
  sortProjects,
  type ProjectSortMode,
} from "@/lib/sort-filter";
import { useProjectsStore } from "@/state/projects.store";

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(timestamp);
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [projectsQuery, setProjectsQuery] = useState("");
  const [projectSortMode, setProjectSortMode] = useState<ProjectSortMode>("updated_desc");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const projects = useProjectsStore((state) => state.projects);
  const isLoading = useProjectsStore((state) => state.isLoading);
  const error = useProjectsStore((state) => state.error);
  const loadProjects = useProjectsStore((state) => state.loadProjects);
  const createProject = useProjectsStore((state) => state.createProject);
  const renameProject = useProjectsStore((state) => state.renameProject);
  const duplicateProject = useProjectsStore((state) => state.duplicateProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);

  useEffect(() => {
    void loadProjects().catch(() => undefined);
  }, [loadProjects]);

  const visibleProjects = useMemo(() => {
    const filtered = filterProjects(projects, projectsQuery);
    return sortProjects(filtered, projectSortMode);
  }, [projects, projectsQuery, projectSortMode]);
  const hasProjects = useMemo(() => projects.length > 0, [projects]);
  const hasVisibleProjects = useMemo(
    () => visibleProjects.length > 0,
    [visibleProjects],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createProject(newProjectName);
      setNewProjectName("");
      setIsCreateOpen(false);
    } catch {
      // Mensagem já fica no estado global da store.
    }
  }

  async function handleRename(id: string, currentName: string) {
    const nextName = window.prompt("Novo nome do projeto:", currentName);

    if (nextName === null) {
      return;
    }

    try {
      await renameProject(id, nextName);
    } catch {
      // Mensagem já fica no estado global da store.
    }
  }

  async function handleDuplicate(id: string, currentName: string) {
    const suggestedName = `Cópia de ${currentName}`;
    const nextName = window.prompt("Nome da cópia:", suggestedName);

    if (nextName === null) {
      return;
    }

    try {
      await duplicateProject(id, nextName);
    } catch {
      // Mensagem já fica no estado global da store.
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o projeto \"${name}\"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(id);
    } catch {
      // Mensagem já fica no estado global da store.
    }
  }

  async function handleImportProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportError(null);
    setImportMessage(null);

    try {
      const text = await file.text();
      const repo = createProjectRepository();
      const imported = await importProjectJson(repo, text);
      await loadProjects();
      setImportMessage(`Projeto importado: ${imported.name}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "falha ao importar projeto");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            SIMEO
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Sistema de Métricas de Extensão e Ocupação
          </p>
        </div>

        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Novo Projeto
        </Button>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}>
          Importar Projeto (JSON)
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            void handleImportProject(event);
          }}
        />
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_14rem]">
        <input
          type="text"
          value={projectsQuery}
          onChange={(event) => setProjectsQuery(event.target.value)}
          placeholder="Buscar por nome do projeto"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
        />
        <select
          value={projectSortMode}
          onChange={(event) => setProjectSortMode(event.target.value as ProjectSortMode)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
        >
          <option value="updated_desc">Atualizado (desc)</option>
          <option value="name_asc">Nome (A-Z)</option>
          <option value="created_desc">Criado (desc)</option>
        </select>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {visibleProjects.length} projeto(s)
        {visibleProjects.length !== projects.length && (
          <span> de {projects.length} no total</span>
        )}
      </p>

      {importMessage && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {importMessage}
        </div>
      )}

      {importError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {importError}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro: {error}
        </div>
      )}

      {isLoading && (
        <p className="mt-6 text-sm text-slate-500">Carregando projetos...</p>
      )}

      {!isLoading && !hasProjects && (
        <section className="mt-10 flex w-full justify-center">
          <Card className="w-full max-w-xl rounded-2xl border border-slate-200 shadow-sm">
            <Card.Main className="space-y-4 px-6 py-8 sm:px-8">
              <p className="text-base text-slate-700 sm:text-lg">
                Nenhum projeto criado ainda. Comece criando seu primeiro workspace.
              </p>
              <Button type="button" onClick={() => setIsCreateOpen(true)}>
                Novo Projeto
              </Button>
            </Card.Main>
          </Card>
        </section>
      )}

      {!isLoading && hasProjects && !hasVisibleProjects && (
        <section className="mt-10 flex w-full justify-center">
          <Card className="w-full max-w-xl rounded-2xl border border-slate-200 shadow-sm">
            <Card.Main className="space-y-3 px-6 py-8 sm:px-8">
              <p className="text-base text-slate-700 sm:text-lg">
                Nenhum projeto corresponde à busca atual.
              </p>
              <Button type="button" variant="outline" onClick={() => setProjectsQuery("")}>
                Limpar busca
              </Button>
            </Card.Main>
          </Card>
        </section>
      )}

      {!isLoading && hasVisibleProjects && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <Card
              key={project.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Card.Header className="pb-2 text-lg font-semibold text-slate-900">
                {project.name}
              </Card.Header>
              <Card.Main className="space-y-2 text-sm text-slate-600">
                <p>Atualizado em: {formatDate(project.updatedAt)}</p>
                <p>Criado em: {formatDate(project.createdAt)}</p>
              </Card.Main>
              <Card.Footer className="flex flex-wrap gap-2 pt-4">
                <Button
                  type="button"
                  variant="default"
                  aria-label={`Abrir projeto ${project.name}`}
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  Abrir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Renomear projeto ${project.name}`}
                  onClick={() => void handleRename(project.id, project.name)}
                >
                  Renomear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Duplicar projeto ${project.name}`}
                  onClick={() => void handleDuplicate(project.id, project.name)}
                >
                  Duplicar
                </Button>
                <Button
                  type="button"
                  variant="ghost-danger"
                  aria-label={`Excluir projeto ${project.name}`}
                  onClick={() => void handleDelete(project.id, project.name)}
                >
                  Excluir
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </section>
      )}

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="novo-projeto-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="novo-projeto-title"
              className="text-xl font-semibold text-slate-900"
            >
              Criar novo projeto
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Informe um nome para identificar o projeto no workspace.
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleCreate}>
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Nome do projeto
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
                  placeholder="Ex.: Monitoramento 2026"
                  maxLength={120}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setNewProjectName("");
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
