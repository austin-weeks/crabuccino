/** Safely converts any type to a string representation */
export function stringify(v: unknown): string {
  if (v === null) return "null";
  if (typeof v !== "object") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
