// ─── Text Parser ───
// Robust parser for messy song lists.  Handles markdown bold, numbered lists,
// various delimiters (hyphens, en/em-dashes, "by"), CSV, and TSV.

export interface ParsedTrack {
  /** Unique id for React keys */
  id: string;
  title: string;
  artist: string;
  raw: string;
}

// ── Internal helpers ────────────────────────────────────────────────────

/** Strip markdown bold / italic artifacts */
function stripMarkdown(s: string): string {
  return s.replace(/\*{1,3}|_{1,3}/g, "").trim();
}

/** Remove leading number prefixes like "1.", "28)", "12 -" etc. */
function stripNumberPrefix(s: string): string {
  return s.replace(/^\d+[\.\)\-:]\s*/, "").trim();
}

/** Clean trailing noise like "(feat. X)", "[Deluxe]", etc. */
function cleanTrailingNoise(s: string): string {
  return s
    .replace(/\s*[\(\[].*(feat|ft|bonus|deluxe|remaster|remix|live|version|edit|explicit|clean|radio|single).*[\)\]]/gi, "")
    .replace(/\s*[\(\[].*[\)\]]$/g, "") // remaining parens at end
    .trim();
}

/** Normalise whitespace and dashes */
function normalise(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Dash variants: hyphen, en-dash, em-dash
const DASH_RE = /\s+[-–—]+\s+/;
const BY_RE = /\s+by\s+/i;

// ── Main parse function ─────────────────────────────────────────────────

/**
 * Splits raw text into individual track lines, then attempts to extract
 * (title, artist) from each using several heuristics in priority order.
 */
export function parseRawText(raw: string): ParsedTrack[] {
  if (!raw.trim()) return [];

  const lines = raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedTrack[] = [];

  for (const line of lines) {
    const cleaned = normalise(stripNumberPrefix(stripMarkdown(line)));
    if (!cleaned) continue;

    const parsed = parseLine(cleaned);
    results.push({
      id: crypto.randomUUID(),
      title: cleanTrailingNoise(parsed.title),
      artist: cleanTrailingNoise(parsed.artist),
      raw: line,
    });
  }

  return results;
}

/**
 * Try several patterns to split a single line into title + artist.
 */
function parseLine(line: string): { title: string; artist: string } {
  // 1. Tab-separated: "Title\tArtist"
  if (line.includes("\t")) {
    const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { title: parts[0], artist: parts[1] };
    }
  }

  // 2. "Title by Artist"  (check before dash, since "by" is more specific)
  if (BY_RE.test(line)) {
    const idx = line.search(BY_RE);
    const title = line.slice(0, idx).trim();
    const artist = line.slice(idx).replace(BY_RE, "").trim();
    if (title && artist) return { title, artist };
  }

  // 3. Dash-separated: could be "Title – Artist" or "Artist – Title"
  //    Heuristic: if there are quotes around one part, that's the title.
  if (DASH_RE.test(line)) {
    const parts = line.split(DASH_RE).map((p) => p.trim());
    if (parts.length >= 2) {
      // Quoted part is usually the title
      const quotedIdx = parts.findIndex((p) => /^["'"'«]/.test(p));
      if (quotedIdx >= 0) {
        const title = parts[quotedIdx].replace(/^["'"'«]|["'"'»]$/g, "");
        const artist = parts.filter((_, i) => i !== quotedIdx).join(" ");
        return { title, artist };
      }
      // Default: first part = title, rest = artist
      return { title: parts[0], artist: parts.slice(1).join(", ") };
    }
  }

  // 4. Comma-separated (only if exactly 2 parts)
  if (line.includes(",")) {
    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      return { title: parts[0], artist: parts[1] };
    }
  }

  // 5. Fallback – entire line is a title with unknown artist
  return { title: line, artist: "" };
}
