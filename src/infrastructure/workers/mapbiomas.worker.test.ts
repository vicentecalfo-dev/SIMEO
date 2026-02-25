import { describe, expect, it } from "vitest";
import {
  handleMapBiomasMessage,
  type MapBiomasMessage,
  type MapBiomasWorkerResponse,
} from "@/infrastructure/workers/mapbiomas.worker";
import { MapBiomasWorkerClient } from "@/infrastructure/workers/useMapBiomasWorker";

class FakeMapBiomasWorker extends EventTarget {
  onmessage: ((event: MessageEvent<MapBiomasWorkerResponse>) => void) | null = null;

  onerror: ((event: Event) => void) | null = null;

  postMessage(message: MapBiomasMessage): void {
    const response = handleMapBiomasMessage(message);
    const event = new MessageEvent<MapBiomasWorkerResponse>("message", {
      data: response,
    });

    this.dispatchEvent(event);
    this.onmessage?.(event);
  }

  terminate(): void {
    // noop for tests
  }
}

describe("mapbiomas.worker", () => {
  it("responde PONG para PING", async () => {
    const client = new MapBiomasWorkerClient({
      workerFactory: () => new FakeMapBiomasWorker() as unknown as Worker,
    });

    const response = await client.ping();

    expect(response).toEqual({ type: "PONG" });
    await expect(client.analyze({ any: true })).resolves.toEqual({
      type: "NOT_IMPLEMENTED",
    });

    client.dispose();
  });
});
