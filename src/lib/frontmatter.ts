type FrontmatterData = Record<string, unknown>;

function scalar(value: string): string | number | boolean {
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^(["'])(.*)\1$/, "$2");
  if (unquoted === "true") return true;
  if (unquoted === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(unquoted)) return Number(unquoted);
  return unquoted;
}

function objectEntry(value: string): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  for (const pair of value.split(/,\s*/)) {
    const separator = pair.indexOf(":");
    if (separator < 1) continue;
    entry[pair.slice(0, separator).trim()] = scalar(pair.slice(separator + 1));
  }
  return entry;
}

export function parseFrontmatter(raw: string): { data: FrontmatterData; content: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: normalized };

  const data: FrontmatterData = {};
  let arrayKey: string | undefined;
  let arrayItems: unknown[] = [];
  let lastObject: Record<string, unknown> | undefined;

  const finishArray = () => {
    if (arrayKey) data[arrayKey] = arrayItems;
    arrayKey = undefined;
    arrayItems = [];
    lastObject = undefined;
  };

  for (const line of match[1].split("\n")) {
    const topLevel = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (topLevel) {
      finishArray();
      const [, key, value] = topLevel;
      if (value === "") arrayKey = key;
      else data[key] = scalar(value);
      continue;
    }

    if (!arrayKey) continue;
    const item = line.match(/^\s+-\s*(.*)$/);
    if (item) {
      const value = item[1].trim();
      if (value.includes(":")) {
        lastObject = objectEntry(value);
        arrayItems.push(lastObject);
      } else {
        lastObject = undefined;
        arrayItems.push(scalar(value));
      }
      continue;
    }

    const nested = line.match(/^\s+([A-Za-z][\w-]*):\s*(.*)$/);
    if (nested && lastObject) lastObject[nested[1]] = scalar(nested[2]);
  }

  finishArray();
  return { data, content: match[2] };
}
