"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  MapBiomasConfig,
  MapBiomasDatasetMeta,
} from "@/domain/entities/project";
import { isValidMapBiomasTiffUrl } from "@/domain/usecases/mapbiomas/validate-mapbiomas-url";

type MapBiomasPanelProps = {
  config: MapBiomasConfig;
  datasets: MapBiomasDatasetMeta[];
  onConfigChange: (patch: Partial<MapBiomasConfig>) => void;
  onAddDatasetFromFile: (payload: {
    year: number;
    fileName: string;
    label?: string;
  }) => void;
  onAddDatasetFromUrl: (payload: { year: number; url: string; label?: string }) => void;
  onRemoveDataset: (datasetId: string) => void;
};

type DatasetInputMode = "file" | "url";

function parseNaturalClasses(raw: string): number[] {
  const tokens = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const unique: number[] = [];

  for (const token of tokens) {
    const parsed = Number(token);
    const normalized = Math.trunc(parsed);

    if (!Number.isFinite(parsed) || normalized < 0 || unique.includes(normalized)) {
      continue;
    }

    unique.push(normalized);
  }

  return unique;
}

function isValidYear(rawYear: string): boolean {
  const parsed = Number(rawYear);
  return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0;
}

function normalizeOptionalLabel(rawLabel: string): string | undefined {
  const trimmed = rawLabel.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function truncateMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const head = value.slice(0, Math.max(0, maxLength - 16));
  const tail = value.slice(-12);
  return `${head}...${tail}`;
}

export function MapBiomasPanel({
  config,
  datasets,
  onConfigChange,
  onAddDatasetFromFile,
  onAddDatasetFromUrl,
  onRemoveDataset,
}: MapBiomasPanelProps) {
  const [naturalClassesText, setNaturalClassesText] = useState(
    config.naturalClasses.join(","),
  );
  const [mode, setMode] = useState<DatasetInputMode>("file");
  const [datasetYear, setDatasetYear] = useState(String(new Date().getFullYear()));
  const [datasetLabel, setDatasetLabel] = useState("");
  const [datasetUrl, setDatasetUrl] = useState("");
  const [datasetError, setDatasetError] = useState<string | null>(null);

  useEffect(() => {
    setNaturalClassesText(config.naturalClasses.join(","));
  }, [config.naturalClasses]);

  const sortedDatasets = useMemo(
    () => [...datasets].sort((left, right) => right.addedAt - left.addedAt),
    [datasets],
  );

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-900">Habitat (MapBiomas)</h3>

      <label className="space-y-1 text-sm text-slate-700">
        <span className="block">Target Shape</span>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
          value={config.targetShape}
          onChange={(event) =>
            onConfigChange({
              targetShape: event.target.value === "AOO" ? "AOO" : "EOO",
            })
          }
        >
          <option value="EOO">EOO</option>
          <option value="AOO">AOO</option>
        </select>
      </label>

      <label className="space-y-1 text-sm text-slate-700">
        <span className="block">Classes naturais</span>
        <input
          type="text"
          value={naturalClassesText}
          onChange={(event) => {
            const value = event.target.value;
            setNaturalClassesText(value);
            onConfigChange({
              naturalClasses: parseNaturalClasses(value),
            });
          }}
          placeholder="1,3,4,5"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
        />
      </label>

      <label className="space-y-1 text-sm text-slate-700">
        <span className="block">Sampling Step</span>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
          value={String(config.samplingStep)}
          onChange={(event) =>
            onConfigChange({
              samplingStep: Number(event.target.value),
            })
          }
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="8">8</option>
        </select>
      </label>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("file");
              setDatasetError(null);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              mode === "file"
                ? "bg-sky-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Arquivo local
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("url");
              setDatasetError(null);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              mode === "url"
                ? "bg-sky-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            URL remota
          </button>
        </div>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="block">Ano</span>
          <input
            type="number"
            min={1}
            step={1}
            value={datasetYear}
            onChange={(event) => {
              setDatasetYear(event.target.value);
              setDatasetError(null);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
          />
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="block">Label (opcional)</span>
          <input
            type="text"
            value={datasetLabel}
            onChange={(event) => {
              setDatasetLabel(event.target.value);
              setDatasetError(null);
            }}
            placeholder="Ex.: Coleção 2023"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
          />
        </label>

        {mode === "file" ? (
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Adicionar arquivo GeoTIFF
            <input
              type="file"
              className="hidden"
              accept=".tif,.tiff,image/tiff"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                if (!isValidYear(datasetYear)) {
                  setDatasetError("Informe um ano válido antes de adicionar o arquivo.");
                  event.currentTarget.value = "";
                  return;
                }

                onAddDatasetFromFile({
                  year: Number(datasetYear),
                  fileName: file.name,
                  label: normalizeOptionalLabel(datasetLabel),
                });
                setDatasetError(null);
                event.currentTarget.value = "";
              }}
            />
          </label>
        ) : (
          <div className="space-y-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span className="block">URL GeoTIFF</span>
              <input
                type="url"
                value={datasetUrl}
                onChange={(event) => {
                  setDatasetUrl(event.target.value);
                  setDatasetError(null);
                }}
                placeholder="https://.../arquivo.tif"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-200"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                if (!isValidYear(datasetYear)) {
                  setDatasetError("Informe um ano válido antes de adicionar a URL.");
                  return;
                }

                if (!isValidMapBiomasTiffUrl(datasetUrl)) {
                  setDatasetError(
                    "URL inválida. Use https:// e finalize com .tif ou .tiff.",
                  );
                  return;
                }

                onAddDatasetFromUrl({
                  year: Number(datasetYear),
                  url: datasetUrl.trim(),
                  label: normalizeOptionalLabel(datasetLabel),
                });
                setDatasetError(null);
                setDatasetUrl("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Adicionar por URL
            </button>
          </div>
        )}

        {datasetError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
            {datasetError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Datasets</p>
        {sortedDatasets.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum dataset adicionado.</p>
        ) : (
          <ul className="space-y-1">
            {sortedDatasets.map((dataset) => (
              <li
                key={dataset.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
              >
                <div className="min-w-0 space-y-0.5 text-slate-700">
                  <p className="font-medium">
                    {dataset.year}{" "}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase">
                      {dataset.sourceType === "url" ? "URL" : "Arquivo"}
                    </span>
                  </p>
                  {dataset.label && <p className="text-xs text-slate-500">{dataset.label}</p>}
                  <p
                    className="truncate text-xs text-slate-600"
                    title={
                      dataset.sourceType === "url" ? dataset.url : dataset.fileName
                    }
                  >
                    {dataset.sourceType === "url"
                      ? truncateMiddle(dataset.url, 58)
                      : dataset.fileName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveDataset(dataset.id)}
                  className="shrink-0 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-slate-600">Nenhuma análise executada ainda.</p>
    </div>
  );
}
