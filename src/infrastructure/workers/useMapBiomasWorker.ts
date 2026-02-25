import type {
  MapBiomasMessage,
  MapBiomasWorkerResponse,
} from "@/infrastructure/workers/mapbiomas.worker";

type MapBiomasWorkerFactory = () => Worker | null;

type MapBiomasWorkerOptions = {
  workerFactory?: MapBiomasWorkerFactory;
  timeoutMs?: number;
};

function createWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }

  try {
    return new Worker(new URL("./mapbiomas.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }
}

export class MapBiomasWorkerClient {
  private readonly timeoutMs: number;

  private readonly workerFactory: MapBiomasWorkerFactory;

  private worker: Worker | null = null;

  constructor(options: MapBiomasWorkerOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.workerFactory = options.workerFactory ?? createWorker;
    this.worker = this.workerFactory();
  }

  async send(message: MapBiomasMessage): Promise<MapBiomasWorkerResponse> {
    if (!this.worker) {
      throw new Error("Worker MapBiomas indisponível.");
    }

    return new Promise<MapBiomasWorkerResponse>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker MapBiomas indisponível."));
        return;
      }

      const timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout aguardando resposta do worker MapBiomas."));
      }, this.timeoutMs);

      const handleMessage = (event: MessageEvent<MapBiomasWorkerResponse>) => {
        cleanup();
        resolve(event.data);
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Falha no worker MapBiomas."));
      };

      const cleanup = () => {
        clearTimeout(timeoutHandle);
        this.worker?.removeEventListener("message", handleMessage);
        this.worker?.removeEventListener("error", handleError);
      };

      this.worker.addEventListener("message", handleMessage);
      this.worker.addEventListener("error", handleError);

      try {
        this.worker.postMessage(message);
      } catch {
        cleanup();
        reject(new Error("Falha ao enviar mensagem para worker MapBiomas."));
      }
    });
  }

  ping(): Promise<MapBiomasWorkerResponse> {
    return this.send({ type: "PING" });
  }

  analyze(payload: unknown): Promise<MapBiomasWorkerResponse> {
    return this.send({ type: "ANALYZE", payload });
  }

  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

let singletonClient: MapBiomasWorkerClient | null = null;

export function useMapBiomasWorker(): MapBiomasWorkerClient {
  if (!singletonClient) {
    singletonClient = new MapBiomasWorkerClient();
  }

  return singletonClient;
}
