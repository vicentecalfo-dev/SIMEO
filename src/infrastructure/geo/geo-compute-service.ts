import {
  normalizeCalcStatus,
  type Occurrence,
} from "@/domain/entities/occurrence";
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

type GeoComputeRequestType = "eoo" | "aoo";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  type: GeoComputeRequestType;
  timeoutHandle: ReturnType<typeof setTimeout>;
};

type GeoComputeServiceOptions = {
  workerFactory?: () => Worker | null;
  timeoutMs?: number;
};

function randomIdFallback(): string {
  return `geo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createCorrelationId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return randomIdFallback();
}

function createWorker(): Worker | null {
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

function serializeValueForWorker(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValueForWorker(item));
  }

  if (value instanceof Set) {
    return [...value].map((item) => serializeValueForWorker(item));
  }

  if (value instanceof Map) {
    const result: Record<string, unknown> = {};

    for (const [key, mapValue] of value.entries()) {
      result[String(key)] = serializeValueForWorker(mapValue);
    }

    return result;
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(source)) {
      const serialized = serializeValueForWorker(nestedValue);

      if (serialized !== undefined) {
        result[key] = serialized;
      }
    }

    return result;
  }

  return undefined;
}

export function serializeOccurrencesForWorker(
  occurrences: Occurrence[],
): Occurrence[] {
  return occurrences.map((occurrence) => {
    const serialized: Occurrence = {
      id: occurrence.id,
      lat: occurrence.lat,
      lon: occurrence.lon,
      calcStatus: normalizeCalcStatus(occurrence.calcStatus),
    };

    if (typeof occurrence.label === "string") {
      serialized.label = occurrence.label;
    }

    if (typeof occurrence.source === "string") {
      serialized.source = occurrence.source;
    }

    if (occurrence.raw && typeof occurrence.raw === "object") {
      const serializedRaw = serializeValueForWorker(occurrence.raw);

      if (
        serializedRaw &&
        typeof serializedRaw === "object" &&
        !Array.isArray(serializedRaw)
      ) {
        serialized.raw = serializedRaw as Record<string, unknown>;
      }
    }

    return serialized;
  });
}

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

export class GeoComputeService {
  private worker?: Worker;

  private readonly pending = new Map<string, PendingRequest>();

  private enabled = false;

  private readonly workerFactory: () => Worker | null;

  private readonly timeoutMs: number;

  constructor(options: GeoComputeServiceOptions = {}) {
    this.workerFactory = options.workerFactory ?? createWorker;
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.initializeWorker();
  }

  private initializeWorker(): void {
    const worker = this.workerFactory();

    if (!worker) {
      this.enabled = false;
      this.worker = undefined;
      return;
    }

    this.worker = worker;
    this.enabled = true;
    this.worker.onmessage = this.handleWorkerMessage;
    this.worker.onerror = this.handleWorkerError;
  }

  private handleWorkerMessage = (event: MessageEvent<GeoWorkerResponse>): void => {
    const response = event.data;
    const pendingRequest = this.finishPendingRequest(response.id);

    if (!pendingRequest) {
      return;
    }

    if (pendingRequest.type !== response.type) {
      pendingRequest.reject(new Error("Resposta inválida do worker."));
      this.disableWorker(new Error("Resposta inválida do worker."));
      return;
    }

    if (!response.ok) {
      pendingRequest.reject(new Error(response.error.message));
      return;
    }

    pendingRequest.resolve(response.result);
  };

  private handleWorkerError = (): void => {
    this.disableWorker(new Error("Falha ao calcular no worker geoespacial."));
  };

  private finishPendingRequest(requestId: string): PendingRequest | undefined {
    const pendingRequest = this.pending.get(requestId);

    if (!pendingRequest) {
      return undefined;
    }

    this.pending.delete(requestId);
    clearTimeout(pendingRequest.timeoutHandle);

    return pendingRequest;
  }

  private rejectAllPending(error: Error): void {
    const pendingRequests = [...this.pending.values()];
    this.pending.clear();

    for (const pendingRequest of pendingRequests) {
      clearTimeout(pendingRequest.timeoutHandle);
      pendingRequest.reject(error);
    }
  }

  private disableWorker(error: Error): void {
    this.enabled = false;

    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = undefined;
    }

    this.rejectAllPending(error);
  }

  private runWithWorker<TResult>(request: GeoWorkerRequest): Promise<TResult> {
    if (!this.worker || !this.enabled) {
      return Promise.reject(new Error("Worker indisponível."));
    }

    return new Promise<TResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.disableWorker(new Error("Timeout ao aguardar resposta do worker."));
      }, this.timeoutMs);

      this.pending.set(request.id, {
        resolve: (value) => {
          resolve(value as TResult);
        },
        reject: (reason) => {
          reject(reason);
        },
        type: request.type,
        timeoutHandle,
      });

      try {
        this.worker?.postMessage(request);
      } catch (error) {
        this.disableWorker(
          toError(error, "Falha ao enviar requisição para o worker."),
        );
      }
    });
  }

  async computeEOO(occurrences: Occurrence[]): Promise<ComputeEooResult> {
    if (this.enabled && this.worker) {
      const request: GeoWorkerRequest = {
        id: createCorrelationId(),
        type: "eoo",
        payload: {
          occurrences: serializeOccurrencesForWorker(occurrences),
        },
      };

      try {
        return await this.runWithWorker<ComputeEooResult>(request);
      } catch {
        // fallback local
      }
    }

    return computeEOO({ occurrences });
  }

  async computeAOO(
    occurrences: Occurrence[],
    cellSizeMeters: number,
  ): Promise<ComputeAooResult> {
    if (this.enabled && this.worker) {
      const request: GeoWorkerRequest = {
        id: createCorrelationId(),
        type: "aoo",
        payload: {
          occurrences: serializeOccurrencesForWorker(occurrences),
          cellSizeMeters,
        },
      };

      try {
        return await this.runWithWorker<ComputeAooResult>(request);
      } catch {
        // fallback local
      }
    }

    return computeAOO({ occurrences, cellSizeMeters });
  }

  dispose(): void {
    this.disableWorker(new Error("GeoComputeService finalizado."));
  }
}

export const geoComputeService = new GeoComputeService();
