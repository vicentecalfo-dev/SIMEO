"use client";

import type { Map as LeafletMap } from "leaflet";
import type { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

type MapCanvasProps = {
  children?: ReactNode;
  onMapReady?: (map: LeafletMap) => void;
};

const INITIAL_CENTER: [number, number] = [-14.235, -51.9253];
const INITIAL_ZOOM = 4;

export function MapCanvas({ children, onMapReady }: MapCanvasProps) {
  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={INITIAL_ZOOM}
      className="min-h-[520px] w-full rounded-xl"
      ref={(map) => {
        if (map) {
          onMapReady?.(map);
        }
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
