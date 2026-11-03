import type { TemplateId } from "@/types/site";
import styles from "./solution-placeholder.module.css";

/**
 * Hueco fijo de la solución, siempre el segundo bloque (después de la esencia de la marca).
 * Mientras se definen las demás acciones, solo anuncia el lugar.
 * Cuando se implemente de verdad, el contenido tiene que ser el de ese nicho:
 * una visita en turismo, un pedido en gastronomía, una cita en servicios.
 */
export function SolutionPlaceholder({ tone }: { tone: TemplateId }) {
  return (
    <section className={`${styles.band} ${styles[tone]}`} aria-label="Aquí va la solución">
      <p className={styles.text}>Aquí va la solución</p>
    </section>
  );
}
