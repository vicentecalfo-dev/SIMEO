import type { Occurrence } from "@/domain/entities/occurrence";
import type { ComputeAooResult } from "@/domain/usecases/aoo/compute-aoo";
import type { ComputeEooResult } from "@/domain/usecases/eoo/compute-eoo";

export type GeoWorkerRequest =
  | {
      id: string;
      type: "eoo";
      payload: {
        occurrences: Occurrence[];
      };
    }
  | {
      id: string;
      type: "aoo";
      payload: {
        occurrences: Occurrence[];
        cellSizeMeters: number;
      };
    };

export type GeoWorkerResponse =
  | {
      id: string;
      ok: true;
      type: "eoo";
      result: ComputeEooResult;
    }
  | {
      id: string;
      ok: true;
      type: "aoo";
      result: ComputeAooResult;
    }
  | {
      id: string;
      ok: false;
      type: "eoo" | "aoo";
      error: {
        message: string;
        stack?: string;
      };
    };
