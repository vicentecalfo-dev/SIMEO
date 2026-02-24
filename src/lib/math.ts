export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const adjusted = (value + Math.sign(value) * Number.EPSILON) * factor;
  return Math.round(adjusted) / factor;
}
