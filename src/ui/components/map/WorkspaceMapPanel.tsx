"use client";

import { useMemo, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MapLayerId, MapLayerVisibility } from "@/domain/entities/map-layers";
import type { Occurrence } from "@/domain/entities/occurrence";
import type { AooResult, EooResult } from "@/domain/entities/project";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { AddPointHandler } from "@/ui/components/map/AddPointHandler";
import { AooGridLayer } from "@/ui/components/map/AooGridLayer";
import { EooLayer } from "@/ui/components/map/EooLayer";
import { MapCanvas } from "@/ui/components/map/MapCanvas";
import { MapPanes } from "@/ui/components/map/MapPanes";
import { MapToolbar } from "@/ui/components/map/MapToolbar";
import { OccurrencesLayer } from "@/ui/components/map/OccurrencesLayer";
import { useMapFitBounds } from "@/ui/components/map/useMapFitBounds";

type WorkspaceMapPanelProps = {
  occurrences: Occurrence[];
  layerOrder: MapLayerId[];
  layerVisibility: MapLayerVisibility;
  eoo?: EooResult;
  aoo?: AooResult;
  onToggleOccurrences: () => void;
  onAddOccurrence: (lat: number, lon: number) => void;
  onToggleOccurrenceCalc: (id: string) => void;
  onDeleteOccurrence: (id: string) => void;
};

export function WorkspaceMapPanel({
  occurrences,
  layerOrder,
  layerVisibility,
  eoo,
  aoo,
  onToggleOccurrences,
  onAddOccurrence,
  onToggleOccurrenceCalc,
  onDeleteOccurrence,
}: WorkspaceMapPanelProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [addPointMode, setAddPointMode] = useState(false);
  const fitBounds = useMapFitBounds();

  const showOccurrences = layerVisibility.occurrences;
  const showEOO = layerVisibility.eoo;
  const showAOO = layerVisibility.aoo;

  const validOccurrences = useMemo(
    () => occurrences.filter((occurrence) => validateLatLon(occurrence.lat, occurrence.lon).ok),
    [occurrences],
  );

  const visibleCount = showOccurrences ? validOccurrences.length : 0;

  return (
    <div className="space-y-3">
      <MapToolbar
        visibleCount={visibleCount}
        canFit={validOccurrences.length > 0}
        showOccurrences={showOccurrences}
        isAddPointMode={addPointMode}
        onToggleOccurrences={onToggleOccurrences}
        onToggleAddPointMode={() => setAddPointMode((current) => !current)}
        onFit={() => {
          void fitBounds(map, validOccurrences);
        }}
      />

      <MapCanvas onMapReady={setMap}>
        <MapPanes order={layerOrder} />
        <AddPointHandler enabled={addPointMode} onAddPoint={onAddOccurrence} />
        <OccurrencesLayer
          occurrences={validOccurrences}
          visible={showOccurrences}
          onToggleOccurrenceCalc={onToggleOccurrenceCalc}
          onDeleteOccurrence={onDeleteOccurrence}
        />
        <EooLayer eoo={eoo} visible={showEOO} />
        <AooGridLayer aoo={aoo} visible={showAOO} />
      </MapCanvas>
    </div>
  );
}
