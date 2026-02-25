"use client";

import type { MapLayerId, MapLayerVisibility } from "@/domain/entities/map-layers";

type LayerOrderPanelProps = {
  order: MapLayerId[];
  visibility: MapLayerVisibility;
  onMoveLayer: (layer: MapLayerId, direction: "up" | "down") => void;
  onToggleLayerVisibility: (layer: MapLayerId, visible: boolean) => void;
};

const LAYER_LABEL: Record<MapLayerId, string> = {
  occurrences: "Ocorrências",
  eoo: "EOO",
  aoo: "AOO",
};

export function LayerOrderPanel({
  order,
  visibility,
  onMoveLayer,
  onToggleLayerVisibility,
}: LayerOrderPanelProps) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-900">Camadas do mapa</h3>
      <p className="text-xs text-slate-600">Ordem de cima para baixo.</p>

      <div className="space-y-2">
        {order.map((layer, index) => (
          <div
            key={layer}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-2 py-2"
          >
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                checked={visibility[layer]}
                onChange={(event) => onToggleLayerVisibility(layer, event.target.checked)}
              />
              {LAYER_LABEL[layer]}
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onMoveLayer(layer, "up")}
                disabled={index === 0}
              >
                Subir
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onMoveLayer(layer, "down")}
                disabled={index === order.length - 1}
              >
                Descer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
