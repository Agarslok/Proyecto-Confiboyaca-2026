import type { IndustryId } from "@/lib/radar/types";
import type { TemplateId } from "@/types/site";

/* ============================================================================
   Banco de fotos por industria. Ninguna es obligatoria: si el archivo no está,
   la plantilla sigue con su ilustración. Van en public/media/sectores/<industria>/.

   El archivo sin «v» es la toma de computador (horizontal).
   El mismo nombre con «v» antes de .webp es la de celular (vertical):
   portada.webp / portadav.webp, apoyo-1.webp / apoyo-1v.webp.
   ========================================================================== */

export interface SectorShot {
  /** Toma horizontal, para computador. */
  file: string;
  /** Toma vertical, para celular. Mismo encuadre, otro archivo. */
  movil?: string;
  /** Dónde cae en la página si el archivo existe. */
  slot: "portada" | "apoyo";
  /** Qué buscar o encargar. Sin logos, sin marcas, sin caras identificables de desconocidos. */
  busca: string;
}

export const SECTOR_SHOTS: Record<IndustryId, SectorShot[]> = {
  moda: [
    { file: "portada.webp", slot: "portada", busca: "interior de tienda de ropa en Colombia, percheros y luz de día, sin logos" },
    { file: "apoyo-1.webp", slot: "apoyo", busca: "telas dobladas y rollos de textil sobre mesa de taller" },
    { file: "apoyo-2.webp", slot: "apoyo", busca: "prenda terminada sobre fondo neutro, foto de producto" },
    { file: "apoyo-3.webp", slot: "apoyo", busca: "taller de confección con máquina de coser, sin marcas visibles" },
  ],
  alimentos: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "plato servido en mesa de restaurante boyacense, luz natural" },
    { file: "panadería.webp", movil: "panaderíav.webp", slot: "apoyo", busca: "panadería o producción de alimentos, bandejas recién horneadas" },
    { file: "cafe.webp", movil: "cafev.webp", slot: "apoyo", busca: "bebida o café servido, vaso o taza, fondo simple" },
    { file: "mostrador.webp", slot: "apoyo", busca: "mostrador de tienda de alimentos con producto fresco" },
  ],
  comercio: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "fachada o pasillo de tienda de barrio en Colombia, productos en estantería" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "producto de canasta sobre fondo claro, foto de catálogo" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "bodega ordenada con cajas y estibas, sin logos de marcas" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "mostrador de pago de una tienda pequeña" },
  ],
  salud: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "sala de espera o consultorio luminoso, sin pacientes reconocibles" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "manos de profesional de salud con bata, sin cara, sin logos" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "estantería de farmacia o productos de cuidado personal" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "espacio de bienestar o gimnasio sencillo, luz natural" },
  ],
  manufactura: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "nave industrial con maquinaria, luz de planta, sin logos" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "detalle de pieza metálica o producto fabricado sobre banco" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "operario de espaldas con casco en línea de producción" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "tablero o estación de control de una planta" },
  ],
  transporte: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "camión de carga en carretera de montaña colombiana, sin marcas" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "bodega logística con estibas y pasillos" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "repartidor de última milla con caja, sin logo de plataforma" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "bus o vehículo de pasajeros en terminal, sin publicidad" },
  ],
  agro: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "cultivo en ladera boyacense, surcos y cielo" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "cosecha en canastas, manos y producto, sin marcas" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "ganado o producción pecuaria en finca, plano abierto" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "producto agroindustrial empacado, café o lácteo, fondo neutro" },
  ],
  pecuaria: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "hato de ganado en potrero, plano abierto" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "vaca lechera en primer plano" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "aves de corral en finca" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "queso o leche, producto de la finca" },
  ],
  servicios: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "oficina de asesoría, mesa de trabajo y luz de día, sin pantallas con datos" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "reunión de dos personas de espaldas o en plano abierto, oficina" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "aula o taller de formación, sillas y tablero" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "escritorio con documentos y calculadora, servicios financieros, sin logos bancarios" },
  ],
  turismo: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "fachada de hotel o posada en pueblo de Boyacá" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "habitación sencilla con ventana y paisaje" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "laguna o páramo, sendero, sin personas en primer plano" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "plaza o calle de pueblo colonial boyacense" },
  ],
  mineria: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "frente de mina o planta de beneficio, paisaje industrial andino, sin logos" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "mineral o carbón en primer plano, textura" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "volqueta o despacho de material en vía destapada" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "panel solar o planta de energía en paisaje rural" },
  ],
  construccion: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "obra de vivienda en construcción, estructura y cielo" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "planos sobre mesa junto a casco, sin logos" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "fachada de casa terminada en municipio colombiano" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "ferretería o materiales apilados, ladrillo y cemento" },
  ],
  madera: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "patio de madera, tablas y vigas apiladas" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "taller de carpintería, corte de madera" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "bosque de pinos o plantación forestal" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "textura de tabla o veta de madera" },
  ],
  otra: [
    { file: "portada.webp", movil: "portadav.webp", slot: "portada", busca: "fachada de negocio local en Boyacá, genérica, sin nombre comercial" },
    { file: "apoyo-1.webp", movil: "apoyo-1v.webp", slot: "apoyo", busca: "equipo de trabajo en sede, plano abierto" },
    { file: "apoyo-2.webp", movil: "apoyo-2v.webp", slot: "apoyo", busca: "producto o servicio sobre mesa, fondo neutro" },
    { file: "apoyo-3.webp", movil: "apoyo-3v.webp", slot: "apoyo", busca: "calle comercial de un municipio, ambiente" },
  ],
};

export const TEMPLATE_OF_INDUSTRY: Record<IndustryId, TemplateId> = {
  moda: "retail",
  alimentos: "gastronomia",
  comercio: "retail",
  salud: "servicios",
  manufactura: "metalurgia",
  transporte: "servicios",
  agro: "agroindustria",
  pecuaria: "agroindustria",
  servicios: "servicios",
  turismo: "turismo",
  mineria: "metalurgia",
  construccion: "servicios",
  madera: "servicios",
  otra: "servicios",
};

/** Ruta pública si alguien deja el archivo con el nombre del catálogo. */
export function sectorImagePath(industry: IndustryId, file: string): string {
  return `/media/sectores/${industry}/${file}`;
}
