"use client";

import { Button, Card } from "@codeworker.br/govbr-tw-react";
import dynamic from "next/dynamic";
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
import {
  filterOccurrences,
  paginate,
  type OccurrenceValidityFilter,
} from "@/domain/usecases/occurrences/query-occurrences";
import { isAooStale } from "@/domain/usecases/aoo/is-aoo-stale";
import { formatKm2 } from "@/domain/usecases/eoo/compute-eoo";
import { isEooStale } from "@/domain/usecases/eoo/is-eoo-stale";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { debounce } from "@/lib/debounce";
import { useWorkspaceStore } from "@/state/workspace.store";
import { ExportPanel } from "@/ui/components/export/ExportPanel";

const WorkspaceMapPanel = dynamic(
  () =>
    import("@/ui/components/map/WorkspaceMapPanel").then(
      (module) => module.WorkspaceMapPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[520px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Carregando mapa...
      </div>
    ),
  },
);

const DEFAULT_PAGE_SIZE = 50;

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
  const computeAOO = useWorkspaceStore((state) => state.computeAOO);
  const computeEOO = useWorkspaceStore((state) => state.computeEOO);
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
  const [occurrenceQuery, setOccurrenceQuery] = useState("");
  const [occurrenceValidity, setOccurrenceValidity] =
    useState<OccurrenceValidityFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showOccurrences, setShowOccurrences] = useState(true);
  const [showEOO, setShowEOO] = useState(false);
  const [showAOO, setShowAOO] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        void (async () => {
          setSavingState("saving");

          try {
            await saveProject();
            setSavingState("saved");
          } catch {
            setSavingState("error");
          }
        })();
      }, 500),
    [saveProject],
  );

  useEffect(() => {
    void loadProject(projectId).catch(() => undefined);
  }, [loadProject, projectId]);

  useEffect(() => {
    setSavingState("idle");
  }, [projectId]);

  useEffect(() => {
    if (!project) {
      debouncedSave.cancel();
      return;
    }

    if (error) {
      setSavingState("error");
      debouncedSave.cancel();
      return;
    }

    if (!isDirty) {
      setSavingState((current) => (current === "error" ? current : "saved"));
      debouncedSave.cancel();
      return;
    }

    setSavingState("saving");
    debouncedSave.call();
  }, [debouncedSave, error, isDirty, project]);

  useEffect(
    () => () => {
      debouncedSave.cancel();
    },
    [debouncedSave],
  );

  useEffect(() => {
    setPage(1);
  }, [occurrenceQuery, occurrenceValidity, project?.occurrences.length]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setShowEOO(Boolean(project.results?.eoo));
    setShowAOO(Boolean(project.results?.aoo));
  }, [project?.id]);

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

  const eooIsStale = useMemo(() => {
    if (!project) {
      return true;
    }

    return isEooStale(project);
  }, [project]);

  const aooIsStale = useMemo(() => {
    if (!project) {
      return true;
    }

    return isAooStale(project);
  }, [project]);

  const filteredOccurrences = useMemo(() => {
    if (!project) {
      return [];
    }

    return filterOccurrences(project.occurrences, {
      query: occurrenceQuery,
      validity: occurrenceValidity,
    });
  }, [occurrenceQuery, occurrenceValidity, project]);

  const paginatedOccurrences = useMemo(
    () => paginate(filteredOccurrences, page, pageSize),
    [filteredOccurrences, page, pageSize],
  );
  const totalPages = paginatedOccurrences.totalPages;
  const safePage = paginatedOccurrences.page;
  const eooResult = project?.results?.eoo;
  const aooResult = project?.results?.aoo;
  const canComputeEOO = quality.valid >= 3;
  const canComputeAOO = quality.valid >= 1;
  const pagedOccurrences = paginatedOccurrences.items;

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

  async function handleComputeEOO() {
    if (!project) {
      return;
    }

    try {
      await computeEOO();
      setShowEOO(true);
      setQualityMessage("EOO calculada e salva no projeto.");
    } catch {
      setQualityMessage("Falha ao calcular EOO.");
    }
  }

  async function handleComputeAOO() {
    if (!project) {
      return;
    }

    try {
      await computeAOO();
      setShowAOO(true);
      setQualityMessage("AOO calculada e salva no projeto.");
    } catch {
      setQualityMessage("Falha ao calcular AOO.");
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
      <main className="mx-auto flex min-h-screen w-full items-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Carregando projeto...</p>
      </main>
    );
  }

  if (error && !project) {
    return (
      <main className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
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
      <main className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
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
    <main className="mx-auto flex min-h-screen w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-900">Análises</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleComputeEOO();
              }}
              disabled={!canComputeEOO}
              className="w-full justify-center"
            >
              Calcular EOO
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleComputeAOO();
              }}
              disabled={!canComputeAOO}
              className="w-full justify-center"
            >
              Calcular AOO
            </Button>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                checked={showEOO}
                onChange={(event) => setShowEOO(event.target.checked)}
                disabled={!eooResult || !eooResult.hull}
              />
              Mostrar EOO
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                checked={showAOO}
                onChange={(event) => setShowAOO(event.target.checked)}
                disabled={!aooResult || aooResult.cellCount === 0}
              />
              Mostrar AOO
            </label>

            <div className="space-y-1 rounded-lg bg-white px-3 py-2 text-sm">
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">Status EOO:</span>{" "}
                <span className={eooIsStale ? "text-amber-700" : "text-emerald-700"}>
                  {eooIsStale ? "Desatualizado" : "Atualizado"}
                </span>
              </p>
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">EOO:</span>{" "}
                {eooResult ? `${formatKm2(eooResult.areaKm2)} km²` : "0,00 km²"}
              </p>
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">Status AOO:</span>{" "}
                <span className={aooIsStale ? "text-amber-700" : "text-emerald-700"}>
                  {aooIsStale ? "Desatualizado" : "Atualizado"}
                </span>
              </p>
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">AOO:</span>{" "}
                {aooResult ? `${formatKm2(aooResult.areaKm2)} km²` : "0,00 km²"}
              </p>
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">Células:</span>{" "}
                {aooResult?.cellCount ?? 0}
              </p>
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">Tamanho da célula:</span>{" "}
                {project.settings.aooCellSizeMeters} m
              </p>
            </div>
            {!canComputeEOO && (
              <p className="text-xs text-amber-700">
                São necessárias ao menos 3 ocorrências válidas para calcular o EOO.
              </p>
            )}
            {!canComputeAOO && (
              <p className="text-xs text-amber-700">
                É necessária ao menos 1 ocorrência válida para calcular o AOO.
              </p>
            )}
          </div>

          <p
            className={`text-sm font-medium ${
              savingState === "error"
                ? "text-red-700"
                : savingState === "saving"
                  ? "text-amber-700"
                  : "text-emerald-700"
            }`}
          >
            {savingState === "error"
              ? "Erro ao salvar"
              : savingState === "saving"
                ? "Salvando..."
                : savingState === "saved"
                  ? "Salvo"
                  : "Aguardando alterações"}
          </p>
        </aside>

        <section className="space-y-4">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Card.Header className="text-lg font-semibold text-slate-900">
              Mapa
            </Card.Header>
            <Card.Main className="space-y-3 pb-6">
              <WorkspaceMapPanel
                occurrences={project.occurrences}
                showOccurrences={showOccurrences}
                showEOO={showEOO}
                showAOO={showAOO}
                eoo={eooResult}
                aoo={aooResult}
                onToggleOccurrences={() => setShowOccurrences((current) => !current)}
              />
            </Card.Main>
          </Card>

          <ExportPanel project={project} />

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
                Tabela e inspeção de ocorrências importadas.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full flex-col gap-2 sm:max-w-xl">
                  <input
                    type="text"
                    value={occurrenceQuery}
                    onChange={(event) => setOccurrenceQuery(event.target.value)}
                    placeholder="Buscar por label"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={occurrenceValidity === "all" ? "default" : "outline"}
                      onClick={() => setOccurrenceValidity("all")}
                    >
                      Todas
                    </Button>
                    <Button
                      type="button"
                      variant={occurrenceValidity === "valid" ? "default" : "outline"}
                      onClick={() => setOccurrenceValidity("valid")}
                    >
                      Somente válidas
                    </Button>
                    <Button
                      type="button"
                      variant={occurrenceValidity === "invalid" ? "default" : "outline"}
                      onClick={() => setOccurrenceValidity("invalid")}
                    >
                      Somente inválidas
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Exibindo {pagedOccurrences.length} de {paginatedOccurrences.totalItems} ocorrência(s)
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
