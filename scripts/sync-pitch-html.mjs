import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source =
  process.env.PITCH_HTML_SOURCE ||
  path.join(process.env.USERPROFILE || "", "Downloads", "pitch-ia-sin-morir.html");
const destDir = path.join(root, "public", "pitch");
const dest = path.join(destDir, "pitch-ia-sin-morir.html");

if (!fs.existsSync(source)) {
  console.error("Missing source:", source);
  process.exit(1);
}

let html = fs.readFileSync(source, "utf8");
const before = html.length;

html = html.replaceAll(
  'Gr="https://mathuexternado.netlify.app/consultoria"',
  'Gr="/consultoria"',
);
html = html.replaceAll(
  '"https://radar-ia-externado.netlify.app"',
  '""',
);

if (!html.includes('Gr="/consultoria"')) {
  console.error("Expected stand URL patch missing");
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(dest, html, "utf8");
console.log("Wrote", dest, "bytes", html.length, "delta", html.length - before);
