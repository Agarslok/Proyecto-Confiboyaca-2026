import fs from "node:fs";
const s = fs.readFileSync(
  "C:/Users/agars/Downloads/Diagnóstico Empresarial Externado (2).html",
  "utf8",
);
const i = s.indexOf('className:"results');
console.log(s.slice(i - 80, i + 1500));
