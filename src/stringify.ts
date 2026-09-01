/** Safely converts any type to a string representation */
export function stringify(v: unknown, truncate: boolean = true): string {
  const s = (() => {
    if (v === null) return "null";
    if (typeof v !== "object") return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  })();
  if (truncate) {
    return s.slice(0, MAX_STRINGIFIED_LENGTH);
  }
  return s;
}

const MAX_STRINGIFIED_LENGTH = 36;
