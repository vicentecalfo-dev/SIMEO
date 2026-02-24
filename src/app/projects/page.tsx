"use client";

import { Button, Card } from "@codeworker.br/govbr-tw-react";

export default function ProjectsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="flex w-full max-w-3xl flex-col items-center">
        <h1 className="text-center text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          SIMEO
        </h1>
        <p className="mt-3 text-center text-sm text-slate-600 sm:text-base lg:text-lg">
          Sistema de Métricas de Extensão e Ocupação
        </p>

        <div className="mt-10 w-full max-w-xl">
          <Card className="rounded-2xl shadow-md">
            <Card.Main className="space-y-6 px-6 py-8 sm:px-8">
              <p className="text-base text-slate-700 sm:text-lg">
                Nenhum projeto criado ainda.
              </p>
              <Button
                type="button"
                variant="default"
              >
                Novo Projeto
              </Button>
            </Card.Main>
          </Card>
        </div>
      </section>
    </main>
  );
}
