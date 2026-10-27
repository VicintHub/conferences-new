import { normalisePhone } from "@/lib/phone";
import type { Category, Mode, NewMember } from "./types";

/** Splits one CSV line, honouring double-quoted fields. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

const CATEGORIES: Category[] = ["delegate", "minister", "international"];

/**
 * Reads "name,email,phone,category,mode" (header optional, columns found by name when present).
 * Unknown categories fall back to delegate and unknown modes to onsite, so a sloppy sheet still imports.
 */
export function parseMembersCsv(text: string): NewMember[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const first = splitLine(lines[0]!).map((h) => h.toLowerCase());
  const hasHeader = first.some((h) => ["name", "full name", "full_name", "email"].includes(h));
  const col = (names: string[], fallback: number) => {
    const at = hasHeader ? first.findIndex((h) => names.includes(h)) : fallback;
    return at < 0 ? fallback : at;
  };
  const idx = {
    name: col(["name", "full name", "full_name"], 0),
    email: col(["email", "email address"], 1),
    phone: col(["phone", "phone number", "mobile"], 2),
    category: col(["category", "type"], 3),
    mode: col(["mode", "attending"], 4),
  };

  return lines.slice(hasHeader ? 1 : 0).map((line) => {
    const f = splitLine(line);
    const cat = (f[idx.category] ?? "").toLowerCase() as Category;
    const mode = (f[idx.mode] ?? "").toLowerCase();
    const phone = normalisePhone(f[idx.phone] ?? "");
    return {
      full_name: f[idx.name] ?? "",
      email: (f[idx.email] ?? "").toLowerCase(),
      ...(phone ? { phone } : {}),
      category: CATEGORIES.includes(cat) ? cat : "delegate",
      mode: (mode === "online" ? "online" : "onsite") as Mode,
    };
  });
}
