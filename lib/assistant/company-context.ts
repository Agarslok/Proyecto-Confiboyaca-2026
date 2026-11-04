/** Pistas operativas a partir del nombre comercial (sin sustituir industria del formulario). */
export function companyNameHint(companyName: string): string {
  const n = fold(companyName);
  if (!n.trim()) return "";

  if (/panader|pasteler|reposter|horno/.test(n)) {
    return "El nombre sugiere panadería o pastelería: habla de turnos de horno, pedidos del día, referencias de pan y merma, no de mesas de restaurante.";
  }
  if (/carnicer|matader|poller|asadero/.test(n)) {
    return "El nombre sugiere carnicería o asadero: prioriza cortes, kilos vendidos, clientes del mostrador y existencias en frío.";
  }
  if (/cafeter|coffee|café|cafe\b/.test(n)) {
    return "El nombre sugiere cafetería: combina consumo en local, pedidos para llevar e insumos (café, leche), no planta industrial genérica.";
  }
  if (/restaur|bistr|meson|parrilla|sushi/.test(n)) {
    return "El nombre sugiere restaurante: mesas, reservas, platos del día y existencias de cocina; no confundas con planta de empaque.";
  }
  if (/hotel|hostal|glamping|aloj/.test(n)) {
    return "El nombre sugiere alojamiento: reservas, huéspedes, habitaciones y cupos; no hables de mesa de restaurante salvo room service.";
  }
  if (/ferreter|materiales|cemento|obra/.test(n)) {
    return "El nombre sugiere materiales u obra: avances, despachos a obra y existencias en bodega.";
  }
  if (/taller|metal|soldad|mecan/.test(n)) {
    return "El nombre sugiere taller o metalmecánica: órdenes, piezas, lotes y tiempos de entrega.";
  }
  if (/finca|agro|campo|lecher|lact/.test(n)) {
    return "El nombre sugiere finca o agro: cosechas, lotes, compradores y existencias del día.";
  }
  if (/boutique|moda|confecc|textil/.test(n)) {
    return "El nombre sugiere moda o confección: tallas, referencias, pedidos y existencias de prenda.";
  }
  if (/drogu|farmaci/.test(n)) {
    return "El nombre sugiere farmacia: medicamentos, rotación y clientes del mostrador.";
  }
  return "";
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}
