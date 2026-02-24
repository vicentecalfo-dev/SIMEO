"use client";

import { Button, Card } from "@codeworker.br/govbr-tw-react";
import { useMemo, useState } from "react";
import type { Project } from "@/domain/entities/project";
import { isAooStale } from "@/domain/usecases/aoo/is-aoo-stale";
import { isEooStale } from "@/domain/usecases/eoo/is-eoo-stale";
import { buildAuditReport } from "@/domain/usecases/export/build-audit-report";
import { exportGeoJson } from "@/domain/usecases/export/export-geojson";
import { exportOccurrencesCsv } from "@/domain/usecases/export/export-occurrences-csv";
import { exportProjectJson } from "@/domain/usecases/export/export-project-json";

type ExportPanelProps = {
  project: Project;
};

function safeFileName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "projeto";
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}

export function ExportPanel({ project }: ExportPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectSlug = useMemo(() => safeFileName(project.name), [project.name]);
  const eooStale = useMemo(
    () => (project.results?.eoo ? isEooStale(project) : false),
    [project],
  );
  const aooStale = useMemo(
    () => (project.results?.aoo ? isAooStale(project) : false),
    [project],
  );
  const report = useMemo(() => buildAuditReport(project), [project]);

  function runExport(action: () => void, successMessage: string) {
    try {
      action();
      setError(null);
      setMessage(successMessage);
    } catch (exportError) {
      setMessage(null);
      setError(exportError instanceof Error ? exportError.message : "falha na exportação");
    }
  }

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <Card.Header className="text-lg font-semibold text-slate-900">
        Exportar
      </Card.Header>
      <Card.Main className="space-y-4 pb-6">
        {eooStale && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            EOO desatualizado — recalcule antes de exportar.
          </div>
        )}

        {aooStale && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            AOO desatualizado — recalcule antes de exportar.
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              runExport(() => {
                const payload = exportProjectJson(project);
                triggerDownload(
                  `${projectSlug}-simeo-project.json`,
                  JSON.stringify(payload, null, 2),
                  "application/json",
                );
              }, "Projeto exportado com sucesso.")
            }
          >
            Baixar Projeto (JSON)
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              runExport(() => {
                const csv = exportOccurrencesCsv(project.occurrences);
                triggerDownload(
                  `${projectSlug}-ocorrencias.csv`,
                  csv,
                  "text/csv;charset=utf-8",
                );
              }, "Ocorrências exportadas com sucesso.")
            }
          >
            Baixar Ocorrências (CSV)
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              runExport(() => {
                const geo = exportGeoJson(project);
                triggerDownload(
                  `${projectSlug}-geoexport.json`,
                  JSON.stringify(geo, null, 2),
                  "application/json",
                );
              }, "GeoJSON exportado com sucesso.")
            }
          >
            Baixar GeoJSON
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              runExport(() => {
                const freshReport = buildAuditReport(project);
                triggerDownload(
                  `${projectSlug}-relatorio-auditavel.json`,
                  JSON.stringify(freshReport, null, 2),
                  "application/json",
                );
              }, "Relatório exportado com sucesso.")
            }
          >
            Baixar Relatório (JSON)
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">Prévia do relatório auditável</p>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      </Card.Main>
    </Card>
  );
}
