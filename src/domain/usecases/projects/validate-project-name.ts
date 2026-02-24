const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 80;

export function validateProjectName(name: string): string {
  const normalized = name.trim();

  if (normalized.length === 0 || normalized.length < MIN_NAME_LENGTH) {
    throw new Error("nome inválido");
  }

  return normalized.slice(0, MAX_NAME_LENGTH);
}
