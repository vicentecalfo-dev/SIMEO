"use client";

import { Button } from "@codeworker.br/govbr-tw-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">SIMEO</h1>
        <p className="mt-3 text-slate-600">
          Sistema de Métricas de Extensão e Ocupação
        </p>
        <Button
                type="button"
                variant="default"
              >
        <Link
          href="/projects"
        >
          Acessar projetos
        </Link>
        </Button>
      </div>
    </main>
  );
}
