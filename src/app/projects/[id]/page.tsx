"use client";

import { Button, Card } from "@codeworker.br/govbr-tw-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ImportCsvResult, CsvMapping } from "@/domain/usecases/occurrences/import-occurrences-csv";
import {
  mapRowsToOccurrences,
  parseCsv,
} from "@/domain/usecases/occurrences/import-occurrences-csv";
import { importOccurrencesJsonFile } from "@/domain/usecases/occurrences/import-occurrences-json";
import {
  dedupeOccurrences,
  removeInvalid,
} from "@/domain/usecases/occurrences/clean-occurrences";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { useWorkspaceStore } from "@/state/workspace.store";

const PAGE_SIZE = 50;

type CsvDraft = {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
};

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(timestamp);
}

function normalizeHeaderName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function guessHeader(headers: string[], candidates: string[]): string | undefined {
  const normalizedCandidates = candidates.map((candidate) => normalizeHeaderName(candidate));

  return headers.find((header) =>
    normalizedCandidates.includes(normalizeHeaderName(header)),
  );
}

function isCsvFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".csv") || file.type.includes("csv");
}

function isJsonFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".json") || file.type.includes("json");
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

  const [csvDraft, setCsvDraft] = useState<CsvDraft | null>(null);
  const [csvMapping, setCsvMapping] = useState<CsvMapping>({
    latColumn: "",
    lonColumn: "",
    labelColumn: undefined,
    idColumn: undefined,
  });
  const [lastImportResult, setLastImportResult] = useState<ImportCsvResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

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
  }, [error, isDirty, project, saveProject]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, project?.occurrences.length]);

  const quality = useMemo(() => {
    if (!project) {
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        duplicateCandidates: 0,
      };
    }

    const invalid = project.occurrences.filter(
      (occurrence) => !validateLatLon(occurrence.lat, occurrence.lon).ok,
    ).length;
    const duplicateCandidates = dedupeOccurrences(project.occurrences).removedCount;

    return {
      total: project.occurrences.length,
      valid: project.occurrences.length - invalid,
      invalid,
      duplicateCandidates,
    };
  }, [project]);

  const filteredOccurrences = useMemo(() => {
    if (!project) {
      return [];
    }

    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return project.occurrences;
    }

    return project.occurrences.filter((occurrence) => {
      const label = (occurrence.label ?? "").toLowerCase();
      return (
        label.includes(normalizedQuery) ||
        occurrence.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [project, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOccurrences.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedOccurrences = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredOccurrences.slice(start, start + PAGE_SIZE);
  }, [filteredOccurrences, safePage]);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportError(null);
    setQualityMessage(null);

    try {
      if (isCsvFile(file)) {
        const parsed = await parseCsv(file);

        if (parsed.headers.length < 2) {
          throw new Error("CSV precisa ter pelo menos duas colunas para lat/lon.");
        }

        const latGuess =
          guessHeader(parsed.headers, ["lat", "latitude", "y"]) ?? parsed.headers[0] ?? "";
        const lonGuess =
          guessHeader(parsed.headers, ["lon", "lng", "longitude", "x"]) ?? parsed.headers[1] ?? "";

        setCsvDraft({
          headers: parsed.headers,
          rows: parsed.rows,
          fileName: file.name,
        });
        setCsvMapping({
          latColumn: latGuess,
          lonColumn: lonGuess,
          labelColumn: guessHeader(parsed.headers, ["label", "nome", "name"]),
          idColumn: guessHeader(parsed.headers, ["id", "identifier", "codigo"]),
        });

        return;
      }

      if (isJsonFile(file)) {
        const result = await importOccurrencesJsonFile(file);

        if (project) {
          setProject({
            occurrences: [...project.occurrences, ...result.imported],
          });
        }

        setLastImportResult(result);
        setCsvDraft(null);
        setQualityMessage(`Importação JSON concluída: ${result.stats.valid} válidas.`);
        return;
      }

      throw new Error("Formato não suportado. Envie um arquivo .csv ou .json.");
    } catch (uploadError) {
      setImportError(uploadError instanceof Error ? uploadError.message : "falha na importação");
    } finally {
      event.target.value = "";
    }
  }

  function handleImportCsv() {
    if (!csvDraft || !project) {
      return;
    }

    if (!csvMapping.latColumn || !csvMapping.lonColumn) {
      setImportError("Selecione as colunas de latitude e longitude.");
      return;
    }

    try {
      const result = mapRowsToOccurrences(csvDraft.rows, csvMapping);

      setProject({
        occurrences: [...project.occurrences, ...result.imported],
      });
      setLastImportResult(result);
      setImportError(null);
      setQualityMessage(`Importação CSV concluída: ${result.stats.valid} válidas.`);
    } catch (mapError) {
      setImportError(mapError instanceof Error ? mapError.message : "falha ao importar csv");
    }
  }

  function handleRemoveInvalid() {
    if (!project) {
      return;
    }

    const cleaned = removeInvalid(project.occurrences);
    setProject({ occurrences: cleaned.kept });
    setQualityMessage(`${cleaned.removedCount} ocorrência(s) inválida(s) removida(s).`);
  }

  function handleRemoveDuplicated() {
    if (!project) {
      return;
    }

    const deduped = dedupeOccurrences(project.occurrences);
    setProject({ occurrences: deduped.kept });
    setQualityMessage(`${deduped.removedCount} ocorrência(s) duplicada(s) removida(s).`);
  }

  function handleClearAll() {
    if (!project) {
      return;
    }

    const confirmed = window.confirm("Deseja remover todas as ocorrências do projeto?");

    if (!confirmed) {
      return;
    }

    setProject({ occurrences: [] });
    setQualityMessage("Todas as ocorrências foram removidas.");
  }

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

        <section className="space-y-4">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Card.Header className="text-lg font-semibold text-slate-900">
              Importar Ocorrências
            </Card.Header>
            <Card.Main className="space-y-4 pb-6">
              <p className="text-sm text-slate-600">
                Faça upload de CSV ou JSON para adicionar pontos ao projeto.
              </p>

              <input
                type="file"
                accept=".csv,.json,application/json,text/csv"
                onChange={(event) => {
                  void handleFileSelect(event);
                }}
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-medium"
              />

              {importError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importError}
                </div>
              )}

              {csvDraft && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">
                    Arquivo CSV: <span className="font-medium">{csvDraft.fileName}</span>
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Latitude</span>
                      <select
                        value={csvMapping.latColumn}
                        onChange={(event) =>
                          setCsvMapping((current) => ({
                            ...current,
                            latColumn: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione...</option>
                        {csvDraft.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Longitude</span>
                      <select
                        value={csvMapping.lonColumn}
                        onChange={(event) =>
                          setCsvMapping((current) => ({
                            ...current,
                            lonColumn: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Selecione...</option>
                        {csvDraft.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Label (opcional)</span>
                      <select
                        value={csvMapping.labelColumn ?? ""}
                        onChange={(event) =>
                          setCsvMapping((current) => ({
                            ...current,
                            labelColumn: event.target.value || undefined,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Nenhuma</option>
                        {csvDraft.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">ID (opcional)</span>
                      <select
                        value={csvMapping.idColumn ?? ""}
                        onChange={(event) =>
                          setCsvMapping((current) => ({
                            ...current,
                            idColumn: event.target.value || undefined,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Gerar automaticamente</option>
                        {csvDraft.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          {csvDraft.headers.map((header) => (
                            <th key={header} className="px-3 py-2 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvDraft.rows.slice(0, 5).map((row, rowIndex) => (
                          <tr key={`${rowIndex}-${row[csvDraft.headers[0] ?? ""] ?? ""}`}>
                            {csvDraft.headers.map((header) => (
                              <td key={`${rowIndex}-${header}`} className="px-3 py-2 text-slate-600">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" onClick={handleImportCsv}>
                      Importar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCsvDraft(null);
                        setImportError(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {lastImportResult && (
                <div className="space-y-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  <p>
                    <span className="font-semibold">Resumo da última importação:</span>
                  </p>
                  <p>
                    Linhas: {lastImportResult.stats.rows} | Válidas: {lastImportResult.stats.valid} |
                    Inválidas: {lastImportResult.stats.invalid} | Zero-zero: {lastImportResult.stats.zeroZero}
                    | Duplicadas removidas: {lastImportResult.stats.deduped}
                  </p>
                  {lastImportResult.invalidRows.length > 0 && (
                    <p>
                      Primeiras inválidas: {lastImportResult.invalidRows
                        .slice(0, 5)
                        .map((row) => `#${row.index}(${row.reason})`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </Card.Main>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Card.Header className="text-lg font-semibold text-slate-900">
              Qualidade
            </Card.Header>
            <Card.Main className="space-y-4 pb-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                  <span className="font-medium">Total</span>
                  <p className="text-xl font-semibold">{quality.total}</p>
                </div>
                <div className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
                  <span className="font-medium">Válidas</span>
                  <p className="text-xl font-semibold">{quality.valid}</p>
                </div>
                <div className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
                  <span className="font-medium">Inválidas</span>
                  <p className="text-xl font-semibold">{quality.invalid}</p>
                </div>
                <div className="rounded-lg bg-indigo-100 px-3 py-2 text-sm text-indigo-900">
                  <span className="font-medium">Duplicadas</span>
                  <p className="text-xl font-semibold">{quality.duplicateCandidates}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleRemoveInvalid}>
                  Remover inválidas
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveDuplicated}>
                  Remover duplicadas
                </Button>
                <Button type="button" variant="ghost-danger" onClick={handleClearAll}>
                  Limpar tudo
                </Button>
              </div>

              {qualityMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {qualityMessage}
                </div>
              )}
            </Card.Main>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Card.Header className="text-lg font-semibold text-slate-900">
              Ocorrências
            </Card.Header>
            <Card.Main className="space-y-4 pb-6">
              <p className="text-sm text-slate-600">
                Mapa será implementado no próximo marco.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por label ou id"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200 sm:max-w-xs"
                />
                <p className="text-xs text-slate-500">
                  Exibindo {pagedOccurrences.length} de {filteredOccurrences.length} ocorrência(s)
                </p>
              </div>

              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Label</th>
                      <th className="px-3 py-2 font-semibold">Lat</th>
                      <th className="px-3 py-2 font-semibold">Lon</th>
                      <th className="px-3 py-2 font-semibold">ID</th>
                      <th className="px-3 py-2 font-semibold">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOccurrences.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                          Nenhuma ocorrência para exibir.
                        </td>
                      </tr>
                    )}

                    {pagedOccurrences.map((occurrence) => (
                      <tr key={occurrence.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{occurrence.label ?? "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{occurrence.lat.toFixed(6)}</td>
                        <td className="px-3 py-2 text-slate-700">{occurrence.lon.toFixed(6)}</td>
                        <td className="px-3 py-2 text-slate-500">{occurrence.id}</td>
                        <td className="px-3 py-2 text-slate-700">{occurrence.source ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={safePage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-600">
                    Página {safePage} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </Card.Main>
          </Card>
        </section>
      </section>
    </main>
  );
}
