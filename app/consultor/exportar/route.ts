import { isConsultor } from "@/lib/auth/dal";
import { answersSheet, diagnosesSheet } from "@/lib/export/diagnoses";
import { toCsv, toXlsx } from "@/lib/export/spreadsheet";
import { getDiagnosisStore } from "@/lib/store/diagnoses";

/**
 * Descarga de todos los diagnósticos (solo consultores).
 *   /consultor/exportar?formato=xlsx        Excel con dos hojas
 *   /consultor/exportar?formato=csv         CSV con «;» (Excel en español)
 *   /consultor/exportar?formato=csv-coma    CSV con «,» (otras herramientas)
 *   &hoja=respuestas                        En CSV, la hoja de respuestas
 */
export async function GET(request: Request) {
  if (!(await isConsultor())) return new Response("No autorizado", { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get("formato") ?? "xlsx";
  const records = getDiagnosisStore().all();
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

  if (format === "csv" || format === "csv-coma") {
    const sheet = url.searchParams.get("hoja") === "respuestas" ? answersSheet(records) : diagnosesSheet(records);
    const body = toCsv(sheet.rows, format === "csv" ? ";" : ",");
    return new Response(body, {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="radar-ia-${sheet.name.toLowerCase()}-${stamp}.csv"`,
      },
    });
  }

  const file = toXlsx([diagnosesSheet(records), answersSheet(records)]);
  return new Response(new Blob([file as BlobPart]), {
    headers: {
      ...headers,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="radar-ia-diagnosticos-${stamp}.xlsx"`,
    },
  });
}
