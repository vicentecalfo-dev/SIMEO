"use client";

import L from "leaflet";
import { GeoJSON } from "react-leaflet";
import type { AooResult } from "@/domain/entities/project";
import { MAP_LAYER_PANES } from "@/ui/components/map/MapPanes";

type AooGridLayerProps = {
  aoo?: AooResult;
  visible?: boolean;
};

type CellProps = {
  cx?: number;
  cy?: number;
  cellSizeMeters?: number;
};

function readCellProps(properties: unknown): CellProps {
  if (!properties || typeof properties !== "object") {
    return {};
  }

  return properties as CellProps;
}

export function AooGridLayer({ aoo, visible = false }: AooGridLayerProps) {
  if (!visible || !aoo || aoo.cellCount === 0) {
    return null;
  }

  const layerKey = `${aoo.inputHash}:${aoo.cellCount}:${aoo.cellSizeMeters}:${aoo.computedAt}`;

  return (
    <GeoJSON
      key={layerKey}
      data={aoo.grid}
      pane={MAP_LAYER_PANES.aoo}
      style={() => ({
        color: "#2563eb",
        weight: 1,
        fillOpacity: 0.12,
      })}
      onEachFeature={(feature, layer) => {
        if (!(layer instanceof L.Path)) {
          return;
        }

        const props = readCellProps(
          "properties" in feature ? feature.properties : undefined,
        );
        const cx = Number.isFinite(props.cx) ? String(props.cx) : "?";
        const cy = Number.isFinite(props.cy) ? String(props.cy) : "?";
        const cellSize = Number.isFinite(props.cellSizeMeters)
          ? String(props.cellSizeMeters)
          : "?";

        layer.bindPopup(
          `<div class="text-sm"><p><strong>Célula:</strong> ${cx}, ${cy}</p><p><strong>Tamanho:</strong> ${cellSize} m</p></div>`,
        );
      }}
    />
  );
}
