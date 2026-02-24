"use client";

import { Button, Card } from "@codeworker.br/govbr-tw-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

  const hasProjects = useMemo(() => projects.length > 0, [projects]);

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
                Nenhum projeto criado ainda.
              </p>
              <Button type="button" onClick={() => setIsCreateOpen(true)}>
                Novo Projeto
              </Button>
            </Card.Main>
          </Card>
        </section>
      )}

      {!isLoading && hasProjects && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
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
