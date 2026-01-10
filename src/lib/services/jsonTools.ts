export function stripCodeFences(text: string): string {
  let out = text.trim();
  if (!out.startsWith("```")) return out;

  out = out.replace(/^```(?:json)?\n?/, "");
  out = out.replace(/\n?```$/, "");
  return out.trim();
}

export function extractFirstJson(text: string): string {
  const s = text.trim();
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");

  let start = -1;
  let openChar: "{" | "[" | null = null;
  if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
    start = firstObj;
    openChar = "{";
  } else if (firstArr !== -1) {
    start = firstArr;
    openChar = "[";
  }

  if (start === -1 || !openChar) {
    throw new Error("No JSON object found");
  }

  const closeChar = openChar === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === openChar) depth++;
    if (ch === closeChar) depth--;

    if (depth === 0) {
      return s.slice(start, i + 1);
    }
  }

  throw new Error("Unterminated JSON");
}

export function parseJsonFromModelOutput<T = any>(text: string): T {
  const normalized = stripCodeFences(text);

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const extracted = extractFirstJson(normalized);
    return JSON.parse(extracted) as T;
  }
}
