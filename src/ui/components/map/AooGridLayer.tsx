"use client";

type AooGridLayerProps = {
  visible?: boolean;
};

export function AooGridLayer({ visible = false }: AooGridLayerProps) {
  if (!visible) {
    return null;
  }

  // Camada reservada para o próximo marco (AOO Grid).
  return null;
}
