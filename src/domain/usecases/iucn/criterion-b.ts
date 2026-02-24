import type { IucnCriterionBInput, IucnCriterionBItem } from "@/domain/entities/project";

export type RiskCategory = "CR" | "EN" | "VU" | "NT" | "LC" | "DD";
export type BSubcriteriaLetter = "a" | "b" | "c";

export type InferCriterionBInput = {
  eooKm2?: number | null;
  aooKm2?: number | null;
  eooStale?: boolean;
  aooStale?: boolean;
  assessment?: IucnCriterionBInput;
  pointsUsed?: number;
  cellSizeMeters?: number;
};

export type CriterionBInference = {
  spatialCategory: RiskCategory;
  b1Triggered: boolean;
  b2Triggered: boolean;
  subcriteriaSatisfied: BSubcriteriaLetter[];
  criterionBMet: boolean;
  suggestedCategory: RiskCategory;
  suggestedCode?: string;
  notes: string[];
  needsRecalc: boolean;
};

type SpatialThreshold = {
  eooMaxExclusive: number;
  aooMaxExclusive: number;
  locationsMaxInclusive: number;
};

const SPATIAL_THRESHOLDS: Record<"CR" | "EN" | "VU", SpatialThreshold> = {
  CR: {
    eooMaxExclusive: 100,
    aooMaxExclusive: 10,
    locationsMaxInclusive: 1,
  },
  EN: {
    eooMaxExclusive: 5000,
    aooMaxExclusive: 500,
    locationsMaxInclusive: 5,
  },
  VU: {
    eooMaxExclusive: 20000,
    aooMaxExclusive: 2000,
    locationsMaxInclusive: 10,
  },
};

const RISK_PRIORITY: Record<RiskCategory, number> = {
  CR: 5,
  EN: 4,
  VU: 3,
  NT: 2,
  LC: 1,
  DD: 0,
};

const ITEM_ORDER: IucnCriterionBItem[] = ["i", "ii", "iii", "iv", "v"];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeItems(items?: IucnCriterionBItem[]): IucnCriterionBItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const unique = new Set<IucnCriterionBItem>();

  for (const item of items) {
    if (ITEM_ORDER.includes(item)) {
      unique.add(item);
    }
  }

  return [...unique].sort((left, right) => ITEM_ORDER.indexOf(left) - ITEM_ORDER.indexOf(right));
}

function spatialCategoryByEoo(eooKm2?: number | null): RiskCategory | null {
  if (!isFiniteNumber(eooKm2)) {
    return null;
  }

  if (eooKm2 < SPATIAL_THRESHOLDS.CR.eooMaxExclusive) {
    return "CR";
  }

  if (eooKm2 < SPATIAL_THRESHOLDS.EN.eooMaxExclusive) {
    return "EN";
  }

  if (eooKm2 < SPATIAL_THRESHOLDS.VU.eooMaxExclusive) {
    return "VU";
  }

  return null;
}

function spatialCategoryByAoo(aooKm2?: number | null): RiskCategory | null {
  if (!isFiniteNumber(aooKm2)) {
    return null;
  }

  if (aooKm2 < SPATIAL_THRESHOLDS.CR.aooMaxExclusive) {
    return "CR";
  }

  if (aooKm2 < SPATIAL_THRESHOLDS.EN.aooMaxExclusive) {
    return "EN";
  }

  if (aooKm2 < SPATIAL_THRESHOLDS.VU.aooMaxExclusive) {
    return "VU";
  }

  return null;
}

function selectHigherRiskCategory(
  left: RiskCategory | null,
  right: RiskCategory | null,
): RiskCategory | null {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return RISK_PRIORITY[left] >= RISK_PRIORITY[right] ? left : right;
}

function formatSubcriteriaCode(
  subcriteriaSatisfied: BSubcriteriaLetter[],
  bItems: IucnCriterionBItem[],
  cItems: IucnCriterionBItem[],
): string {
  let code = "";

  if (subcriteriaSatisfied.includes("a")) {
    code += "a";
  }

  if (subcriteriaSatisfied.includes("b")) {
    code += bItems.length > 0 ? `b(${bItems.join(",")})` : "b";
  }

  if (subcriteriaSatisfied.includes("c")) {
    code += cItems.length > 0 ? `c(${cItems.join(",")})` : "c";
  }

  return code;
}

function isCriterionRiskCategory(category: RiskCategory): category is "CR" | "EN" | "VU" {
  return category === "CR" || category === "EN" || category === "VU";
}

export function inferCriterionB(input: InferCriterionBInput): CriterionBInference {
  const notes: string[] = [];
  const eooCategory = spatialCategoryByEoo(input.eooKm2);
  const aooCategory = spatialCategoryByAoo(input.aooKm2);
  const bestSpatialCategory = selectHigherRiskCategory(eooCategory, aooCategory);

  const hasEoo = isFiniteNumber(input.eooKm2);
  const hasAoo = isFiniteNumber(input.aooKm2);

  const spatialCategory: RiskCategory = bestSpatialCategory
    ? bestSpatialCategory
    : hasEoo || hasAoo
      ? "LC"
      : "DD";

  const threshold = isCriterionRiskCategory(spatialCategory)
    ? SPATIAL_THRESHOLDS[spatialCategory]
    : null;

  const b1Triggered =
    Boolean(threshold) &&
    isFiniteNumber(input.eooKm2) &&
    input.eooKm2 < threshold.eooMaxExclusive;

  const b2Triggered =
    Boolean(threshold) &&
    isFiniteNumber(input.aooKm2) &&
    input.aooKm2 < threshold.aooMaxExclusive;

  const locations = input.assessment?.numberOfLocations;
  const hasValidLocationCount = isFiniteNumber(locations) && locations >= 0;
  const normalizedLocations = hasValidLocationCount ? Number(locations) : null;

  const aSatisfied =
    Boolean(threshold) &&
    (input.assessment?.severelyFragmented === true ||
      (normalizedLocations !== null &&
        normalizedLocations <= threshold.locationsMaxInclusive));

  const bSatisfied = input.assessment?.continuingDecline?.enabled === true;
  const cSatisfied = input.assessment?.extremeFluctuations?.enabled === true;

  const subcriteriaSatisfied: BSubcriteriaLetter[] = [];

  if (aSatisfied) {
    subcriteriaSatisfied.push("a");
  }

  if (bSatisfied) {
    subcriteriaSatisfied.push("b");
  }

  if (cSatisfied) {
    subcriteriaSatisfied.push("c");
  }

  const criterionBMet =
    isCriterionRiskCategory(spatialCategory) && subcriteriaSatisfied.length >= 2;

  let suggestedCode: string | undefined;

  if (criterionBMet) {
    const bItems = normalizeItems(input.assessment?.continuingDecline?.items);
    const cItems = normalizeItems(input.assessment?.extremeFluctuations?.items);
    const subcriteriaCode = formatSubcriteriaCode(subcriteriaSatisfied, bItems, cItems);

    const criterionCodes: string[] = [];

    if (b1Triggered) {
      criterionCodes.push(`B1${subcriteriaCode}`);
    }

    if (b2Triggered) {
      criterionCodes.push(`${b1Triggered ? "2" : "B2"}${subcriteriaCode}`);
    }

    if (criterionCodes.length > 0) {
      suggestedCode = `${spatialCategory} ${criterionCodes.join("+")}`;
    }

    notes.push(
      `Sugestão automática para Critério B: ${spatialCategory}${
        suggestedCode ? ` (${suggestedCode})` : ""
      }.`,
    );
  } else if (isCriterionRiskCategory(spatialCategory)) {
    const via: string[] = [];

    if (b1Triggered) {
      via.push("B1");
    }

    if (b2Triggered) {
      via.push("B2");
    }

    notes.push(
      `Atende limiar espacial para ${spatialCategory} via ${
        via.length > 0 ? via.join("/") : "B1/B2"
      }, mas faltam subcritérios (a/b/c).`,
    );
  } else if (spatialCategory === "DD") {
    notes.push("Dados insuficientes para aplicar o Critério B (EOO e AOO ausentes).");
  } else {
    notes.push("EOO/AOO acima dos limiares de VU no escopo do Critério B.");
  }

  const needsRecalc = Boolean(input.eooStale || input.aooStale);

  if (needsRecalc) {
    notes.push("Resultados desatualizados podem invalidar a sugestão.");
  }

  return {
    spatialCategory,
    b1Triggered,
    b2Triggered,
    subcriteriaSatisfied,
    criterionBMet,
    suggestedCategory: spatialCategory,
    suggestedCode,
    notes,
    needsRecalc,
  };
}
