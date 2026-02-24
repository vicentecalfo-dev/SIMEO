/// <reference lib="webworker" />

import { computeAOO } from "../../domain/usecases/aoo/compute-aoo";
import { computeEOO } from "../../domain/usecases/eoo/compute-eoo";
import type {
  GeoWorkerRequest,
  GeoWorkerResponse,
} from "../geo/geo-compute-types";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<GeoWorkerRequest>) => {
  const request = event.data;

  try {
    if (request.type === "eoo") {
      const result = computeEOO({
        occurrences: request.payload.occurrences,
      });

      const response: GeoWorkerResponse = {
        id: request.id,
        ok: true,
        type: "eoo",
        result,
      };

      workerScope.postMessage(response);
      return;
    }

    const result = computeAOO({
      occurrences: request.payload.occurrences,
      cellSizeMeters: request.payload.cellSizeMeters,
    });

    const response: GeoWorkerResponse = {
      id: request.id,
      ok: true,
      type: "aoo",
      result,
    };

    workerScope.postMessage(response);
  } catch (error) {
    const response: GeoWorkerResponse = {
      id: request.id,
      ok: false,
      type: request.type,
      error: {
        message: error instanceof Error ? error.message : "Falha ao calcular no worker.",
        stack: error instanceof Error ? error.stack : undefined,
      },
    };

    workerScope.postMessage(response);
  }
};

export {};
