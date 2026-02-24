import { describe, expect, it } from "vitest";
import { inferCriterionB } from "@/domain/usecases/iucn/criterion-b";

describe("inferCriterionB", () => {
  it("sugere CR por B1 quando cumpre a+b", () => {
    const result = inferCriterionB({
      eooKm2: 50,
      aooKm2: null,
      assessment: {
        severelyFragmented: true,
        numberOfLocations: 1,
        continuingDecline: {
          enabled: true,
          items: ["iii"],
        },
      },
    });

    expect(result.spatialCategory).toBe("CR");
    expect(result.criterionBMet).toBe(true);
    expect(result.suggestedCategory).toBe("CR");
    expect(result.suggestedCode).toBe("CR B1ab(iii)");
  });

  it("sugere EN por B1 quando B2 não dispara no limiar EN", () => {
    const result = inferCriterionB({
      eooKm2: 3000,
      aooKm2: 600,
      assessment: {
        numberOfLocations: 3,
        continuingDecline: {
          enabled: true,
        },
      },
    });

    expect(result.spatialCategory).toBe("EN");
    expect(result.b1Triggered).toBe(true);
    expect(result.b2Triggered).toBe(false);
    expect(result.criterionBMet).toBe(true);
    expect(result.suggestedCode).toBe("EN B1ab");
  });

  it("sugere VU por B2 quando EOO está fora do limiar", () => {
    const result = inferCriterionB({
      eooKm2: 30000,
      aooKm2: 1500,
      assessment: {
        numberOfLocations: 10,
        continuingDecline: {
          enabled: true,
        },
      },
    });

    expect(result.spatialCategory).toBe("VU");
    expect(result.b1Triggered).toBe(false);
    expect(result.b2Triggered).toBe(true);
    expect(result.criterionBMet).toBe(true);
    expect(result.suggestedCode).toBe("VU B2ab");
  });

  it("não fecha Critério B quando só um subcritério está satisfeito", () => {
    const result = inferCriterionB({
      eooKm2: 80,
      aooKm2: 9,
      assessment: {
        severelyFragmented: true,
        continuingDecline: {
          enabled: false,
        },
        extremeFluctuations: {
          enabled: false,
        },
      },
    });

    expect(result.spatialCategory).toBe("CR");
    expect(result.criterionBMet).toBe(false);
    expect(result.suggestedCode).toBeUndefined();
    expect(result.notes.some((note) => note.includes("faltam subcritérios"))).toBe(true);
  });

  it("retorna DD quando EOO e AOO não existem", () => {
    const result = inferCriterionB({
      eooKm2: null,
      aooKm2: null,
      assessment: {
        severelyFragmented: true,
      },
    });

    expect(result.spatialCategory).toBe("DD");
    expect(result.suggestedCategory).toBe("DD");
    expect(result.criterionBMet).toBe(false);
  });

  it("marca needsRecalc e adiciona aviso quando stale", () => {
    const result = inferCriterionB({
      eooKm2: 3000,
      aooKm2: 700,
      eooStale: true,
      aooStale: false,
      assessment: {
        numberOfLocations: 2,
        continuingDecline: {
          enabled: true,
        },
      },
    });

    expect(result.needsRecalc).toBe(true);
    expect(result.notes.some((note) => note.includes("desatualizados"))).toBe(true);
  });
});
