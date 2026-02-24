"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Project } from "@/domain/entities/project";
import { getProjectUseCase } from "@/domain/usecases/projects/get-project";
import { createProjectRepository } from "@/infrastructure/storage/dexie-project-repository";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "erro inesperado";
}

export default function WorkspaceProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      setIsLoading(true);
      setError(null);

      try {
        const repo = createProjectRepository();
        const found = await getProjectUseCase(repo, projectId);

        if (!cancelled) {
          setProject(found);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Carregando projeto...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
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
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Workspace do Projeto
        </h1>
        <p className="text-base text-slate-700">
          <span className="font-semibold">Nome:</span> {project.name}
        </p>
        <p className="text-sm text-slate-600">
          ID do projeto: <span className="font-semibold text-slate-900">{project.id}</span>
        </p>
      </header>

      <div className="flex items-center">
        <Link
          href="/projects"
          className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Voltar para Projetos
        </Link>
      </div>

      <section className="grid flex-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4" />
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-slate-500">
          Mapa futuramente aqui
        </div>
      </section>
    </main>
  );
}
