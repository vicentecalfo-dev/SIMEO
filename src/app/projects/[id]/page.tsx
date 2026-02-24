"use client";

import { useParams } from "next/navigation";

export default function WorkspaceProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Workspace do Projeto
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          ID do projeto: <span className="font-semibold text-slate-900">{projectId}</span>
        </p>
      </header>

      <section className="grid flex-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4" />
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-slate-500">
          Mapa futuramente aqui
        </div>
      </section>
    </main>
  );
}
