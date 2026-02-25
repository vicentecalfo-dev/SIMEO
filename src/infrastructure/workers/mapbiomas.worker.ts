/// <reference lib="webworker" />

export type MapBiomasMessage =
  | { type: "PING" }
  | { type: "ANALYZE"; payload: unknown };

export type MapBiomasWorkerResponse =
  | { type: "PONG" }
  | { type: "NOT_IMPLEMENTED" };

export function handleMapBiomasMessage(
  message: MapBiomasMessage,
): MapBiomasWorkerResponse {
  if (message.type === "PING") {
    return { type: "PONG" };
  }

  return { type: "NOT_IMPLEMENTED" };
}

const isDedicatedWorkerScope =
  typeof DedicatedWorkerGlobalScope !== "undefined" &&
  globalThis instanceof DedicatedWorkerGlobalScope;

if (isDedicatedWorkerScope) {
  const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope;

  workerScope.onmessage = (event: MessageEvent<MapBiomasMessage>) => {
    const response = handleMapBiomasMessage(event.data);
    workerScope.postMessage(response);
  };
}

export {};
