"use client";

import { Button } from "@codeworker.br/govbr-tw-react";

type MapToolbarProps = {
  visibleCount: number;
  canFit: boolean;
  showOccurrences: boolean;
  isAddPointMode: boolean;
  onFit: () => void;
  onToggleOccurrences: () => void;
  onToggleAddPointMode: () => void;
};

export function MapToolbar({
  visibleCount,
  canFit,
  showOccurrences,
  isAddPointMode,
  onFit,
  onToggleOccurrences,
  onToggleAddPointMode,
}: MapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <Button type="button" variant="outline" onClick={onToggleOccurrences}>
        {showOccurrences ? "Ocorrências: Ligado" : "Ocorrências: Desligado"}
      </Button>
      <Button type="button" variant="default" onClick={onFit} disabled={!canFit}>
        Enquadrar pontos
      </Button>
      <Button type="button" variant="outline" onClick={onToggleAddPointMode}>
        {isAddPointMode ? "Adicionar ponto: Ligado" : "Adicionar ponto: Desligado"}
      </Button>
      <span className="text-sm text-slate-700">Ocorrências visíveis: {visibleCount}</span>
    </div>
  );
}
