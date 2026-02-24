"use client";

type EooLayerProps = {
  visible?: boolean;
};

export function EooLayer({ visible = false }: EooLayerProps) {
  if (!visible) {
    return null;
  }

  // Camada reservada para o próximo marco (EOO).
  return null;
}
