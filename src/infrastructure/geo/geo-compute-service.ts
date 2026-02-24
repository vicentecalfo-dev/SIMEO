import type { Occurrence } from "@/domain/entities/occurrence";
import {
  computeAOO,
  type ComputeAooResult,
} from "@/domain/usecases/aoo/compute-aoo";
import {
  computeEOO,
  type ComputeEooResult,
} from "@/domain/usecases/eoo/compute-eoo";
import type {
  GeoWorkerRequest,
  GeoWorkerResponse,
} from "@/infrastructure/geo/geo-compute-types";

let sequence = 0;

function nextRequestId(): string {
  sequence += 1;
  return `geo-${Date.now()}-${sequence}`;
}

function createWorkerInstance(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }

  try {
    return new Worker(new URL("../workers/geo.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }
}

function runWorkerRequest<TResult>(request: GeoWorkerRequest): Promise<TResult | null> {
  const worker = createWorkerInstance();

  if (!worker) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<GeoWorkerResponse>) => {
      const response = event.data;

      if (!response || response.requestId !== request.requestId) {
        return;
      }

      cleanup();

      if (!response.ok) {
        reject(new Error(response.error));
        return;
      }

      resolve(response.result as TResult);
    };

    worker.onerror = () => {
      cleanup();
      reject(new Error("falha ao executar cálculo no worker"));
    };

    worker.postMessage(request);
  });
}

export async function computeEOOAsync(
  occurrences: Occurrence[],
): Promise<ComputeEooResult> {
  const request: GeoWorkerRequest = {
    requestId: nextRequestId(),
    type: "eoo",
    payload: { occurrences },
  };

  try {
    const workerResult = await runWorkerRequest<ComputeEooResult>(request);

    if (workerResult) {
      return workerResult;
    }
  } catch {
    // fallback local
  }

  return computeEOO({ occurrences });
}

export async function computeAOOAsync(
  occurrences: Occurrence[],
  cellSizeMeters: number,
): Promise<ComputeAooResult> {
  const request: GeoWorkerRequest = {
    requestId: nextRequestId(),
    type: "aoo",
    payload: { occurrences, cellSizeMeters },
  };

  try {
    const workerResult = await runWorkerRequest<ComputeAooResult>(request);

    if (workerResult) {
      return workerResult;
    }
  } catch {
    // fallback local
  }

  return computeAOO({ occurrences, cellSizeMeters });
}
