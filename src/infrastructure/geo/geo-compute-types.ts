import type { Occurrence } from "@/domain/entities/occurrence";
import type { ComputeAooResult } from "@/domain/usecases/aoo/compute-aoo";
import type { ComputeEooResult } from "@/domain/usecases/eoo/compute-eoo";

export type GeoWorkerRequest =
  | {
      requestId: string;
      type: "eoo";
      payload: {
        occurrences: Occurrence[];
      };
    }
  | {
      requestId: string;
      type: "aoo";
      payload: {
        occurrences: Occurrence[];
        cellSizeMeters: number;
      };
    };

export type GeoWorkerSuccessResponse = {
  requestId: string;
  ok: true;
  result: ComputeEooResult | ComputeAooResult;
};

export type GeoWorkerErrorResponse = {
  requestId: string;
  ok: false;
  error: string;
};

export type GeoWorkerResponse = GeoWorkerSuccessResponse | GeoWorkerErrorResponse;
