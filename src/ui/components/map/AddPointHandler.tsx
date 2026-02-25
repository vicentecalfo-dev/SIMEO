"use client";

import { useMapEvents } from "react-leaflet";

type AddPointHandlerProps = {
  enabled: boolean;
  onAddPoint: (lat: number, lon: number) => void;
};

export function AddPointHandler({ enabled, onAddPoint }: AddPointHandlerProps) {
  useMapEvents({
    click(event) {
      if (!enabled) {
        return;
      }

      onAddPoint(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}
