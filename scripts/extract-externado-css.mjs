import fs from "node:fs";
import path from "node:path";

const htmlPath =
  "C:/Users/agars/Downloads/Diagnóstico Empresarial Externado (2).html";
const root = path.resolve(import.meta.dirname, "..");
const outCss = path.join(root, "app/styles/externado.css");
const outPng = path.join(root, "public/externado-logo-mask.png");

const s = fs.readFileSync(htmlPath, "utf8");
const start = s.indexOf("<style>\n/* Sistema visual");
const end = s.indexOf("</style>", start);
if (start < 0 || end < 0) {
  console.error("Could not find style block");
  process.exit(1);
}
let css = s.slice(start + 7, end);

const dataUrlRe =
  /-webkit-mask:url\("data:image\/png;base64,([^"]+)"\) center\/contain no-repeat;mask:url\("data:image\/png;base64,[^"]+"\) center\/contain no-repeat/g;
const m = dataUrlRe.exec(css);
if (m) {
  fs.writeFileSync(outPng, Buffer.from(m[1], "base64"));
  css = css.replace(
    dataUrlRe,
    "-webkit-mask:url(/externado-logo-mask.png) center/contain no-repeat;mask:url(/externado-logo-mask.png) center/contain no-repeat",
  );
}

fs.mkdirSync(path.dirname(outCss), { recursive: true });
fs.writeFileSync(outCss, css);
console.log("Wrote", outCss, css.length, "bytes");
