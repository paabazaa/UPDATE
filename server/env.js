import fs from "node:fs";
import path from "node:path";

// Reads KEY=value lines from a .env file into process.env. Values already set by the host (Render, for example) win,
// so the same code works on the live site with no file and on a computer with one. A missing file is fine.
export function loadEnvFile(file = path.resolve(process.cwd(), ".env"), env = process.env) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { return 0; }
  let count = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    if (env[match[1]] === undefined) { env[match[1]] = value; count++; }
  }
  return count;
}
