export type TeamMember = {
  /** Nombre corto en tarjeta: primer nombre + primer apellido */
  displayName: string;
  role: string;
  photo: string;
  links: {
    linkedin?: string;
    github?: string;
  };
};

export const TEAM = {
  name: "Nuestro equipo",
  summary:
    "Prototipo académico desarrollado en el Departamento de Matemáticas de la Universidad Externado de Colombia para explorar cómo los datos, la automatización y la inteligencia artificial pueden apoyar a las empresas.",
  members: [
    {
      displayName: "María García",
      role: "Directora del departamento de Matemáticas",
      photo: "/equipo/Maria-Constanza-Garcia-Chaves.webp",
      links: {
        linkedin: "https://www.linkedin.com/in/constanza-garc%C3%ADa-chaves-6ba068152/",
      },
    },
    {
      displayName: "Katherinne Sandoval",
      role: "Marketing estratégico y comercial",
      photo: "/equipo/Katherinne-Sandoval.jpg",
      links: {
        linkedin: "https://www.linkedin.com/in/katherinnesandovall/",
      },
    },
    {
      displayName: "Carlos Ruiz",
      role: "Docente",
      photo: "/equipo/Carlos-Fabian-Ruiz-Paredes.webp",
      links: {},
    },
    {
      displayName: "Juan Carlos Urueña",
      role: "Docente",
      photo: "/equipo/Juan-Carlos-Uruena-Mejia.webp",
      links: {
        linkedin: "https://www.linkedin.com/in/juan-carlos-urue%C3%B1a-mejia-81b11227b/",
      },
    },
    {
      displayName: "Juan Triana",
      role: "Estudiante de Ciencia de Datos",
      photo: "/equipo/Juan-Angel-Triana.png",
      links: {
        linkedin: "https://www.linkedin.com/in/juan-angel-triana-olarte/",
        github: "https://github.com/Agarslok",
      },
    },
    {
      displayName: "Daniel Pacheco",
      role: "Estudiante de Ciencia de Datos",
      photo: "/equipo/Daniel-Pacheco.png",
      links: {
        linkedin: "https://www.linkedin.com/in/daniel-pacheco-datos/",
        github: "https://github.com/PachecoDa",
      },
    },
  ] satisfies TeamMember[],
};

export const DEPT_URL = "https://www.uexternado.edu.co/departamento-de-matematicas/";
export const UNI_URL = "https://www.uexternado.edu.co/";

export const HOME_SECTIONS = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "soluciones", label: "Soluciones" },
  { id: "equipo", label: "Equipo" },
] as const;
