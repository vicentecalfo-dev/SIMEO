/// <reference lib="webworker" />

import { computeAOO } from "../../domain/usecases/aoo/compute-aoo";
import { computeEOO } from "../../domain/usecases/eoo/compute-eoo";
import type {
  GeoWorkerRequest,
  GeoWorkerResponse,
} from "../geo/geo-compute-types";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<GeoWorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === "eoo") {
      const result = computeEOO({
        occurrences: message.payload.occurrences,
      });

      const response: GeoWorkerResponse = {
        requestId: message.requestId,
        ok: true,
        result,
      };

      workerScope.postMessage(response);
      return;
    }

    const result = computeAOO({
      occurrences: message.payload.occurrences,
      cellSizeMeters: message.payload.cellSizeMeters,
    });

    const response: GeoWorkerResponse = {
      requestId: message.requestId,
      ok: true,
      result,
    };

    workerScope.postMessage(response);
  } catch (error) {
    const response: GeoWorkerResponse = {
      requestId: message.requestId,
      ok: false,
      error: error instanceof Error ? error.message : "erro no worker",
    };

    workerScope.postMessage(response);
  }
};

export {};
