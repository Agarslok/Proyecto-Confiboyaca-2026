/** Marca institucional solo en la apertura del pitch (sin barra ni fondo). */
export function PitchInstitutionIntro() {
  return (
    <div className="pd-inst-intro" aria-label="Universidad Externado de Colombia · Departamento de Matemáticas">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="pd-inst-lockup"
        src="/pitch/externado-dept-lockup-transparent.png"
        alt="Universidad Externado de Colombia · Departamento de Matemáticas"
        width={1024}
        height={275}
        decoding="async"
      />
    </div>
  );
}
