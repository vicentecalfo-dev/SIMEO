import { describe, expect, it } from "vitest";
import { getZIndexMap, moveLayer, setLayerOrder } from "@/lib/layer-order";

describe("layer-order", () => {
  it("moveLayer sobe e desce corretamente", () => {
    const initial = ["occurrences", "eoo", "aoo"] as const;

    expect(moveLayer([...initial], "eoo", "up")).toEqual(["eoo", "occurrences", "aoo"]);
    expect(moveLayer([...initial], "eoo", "down")).toEqual(["occurrences", "aoo", "eoo"]);
    expect(moveLayer([...initial], "occurrences", "up")).toEqual([
      "occurrences",
      "eoo",
      "aoo",
    ]);
    expect(moveLayer([...initial], "aoo", "down")).toEqual(["occurrences", "eoo", "aoo"]);
  });

  it("setLayerOrder corrige entradas inválidas", () => {
    const invalidOrder = [
      "eoo",
      "foo",
      "occurrences",
    ] as unknown as Array<"occurrences" | "eoo" | "aoo">;

    expect(setLayerOrder(invalidOrder)).toEqual(["eoo", "occurrences", "aoo"]);
    expect(
      setLayerOrder(["eoo", "eoo", "occurrences"] as Array<"occurrences" | "eoo" | "aoo">),
    ).toEqual([
      "eoo",
      "occurrences",
      "aoo",
    ]);
    expect(setLayerOrder([])).toEqual(["occurrences", "eoo", "aoo"]);
  });

  it("getZIndexMap prioriza camadas mais acima", () => {
    const zMapDefaultBase = getZIndexMap(["occurrences", "eoo", "aoo"]);
    const zMap = getZIndexMap(["occurrences", "eoo", "aoo"], 600);

    expect(zMapDefaultBase).toEqual({
      occurrences: 402,
      eoo: 401,
      aoo: 400,
    });
    expect(zMap.occurrences).toBeGreaterThan(zMap.eoo);
    expect(zMap.eoo).toBeGreaterThan(zMap.aoo);
    expect(zMap).toEqual({
      occurrences: 602,
      eoo: 601,
      aoo: 600,
    });
  });
});
