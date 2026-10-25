import fs from "node:fs";

const source = fs.readFileSync(
  "C:/Users/agars/Downloads/diagnostico-externado-colibri (2).html",
  "utf8",
);
const marker = "window.__COLIBRI__ = \"";
const start = source.indexOf(marker);
if (start < 0) throw new Error("No se encontró la imagen del colibrí");
const dataStart = start + marker.length;
const dataEnd = source.indexOf("\"", dataStart);
const data = source.slice(dataStart, dataEnd);
const prefix = "data:image/webp;base64,";
if (!data.startsWith(prefix)) throw new Error("La imagen no es un WebP local");
const bytes = Buffer.from(data.slice(prefix.length), "base64");
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/colibri.webp", bytes);
console.log(`colibri.webp ${bytes.length} bytes`);
