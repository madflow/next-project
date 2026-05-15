export const emptyUpdateMessage = "At least one field must be provided for update";

export function hasUpdateChanges(input: Record<string, unknown>) {
  return Object.values(input).some((value) => value !== undefined);
}
