const HABILIDADES_CONOCIDAS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "React",
  "Node.js",
  "Express",
  "SQL",
  "PostgreSQL",
  "Git",
  "GitHub",
  "Docker",
  "HTML/CSS",
  "Supabase",
];

const PALABRAS_OBLIGATORIAS = [
  "obligatorio",
  "obligatoria",
  "requerido",
  "requerida",
  "se requiere",
  "se requieren",
  "debe tener",
  "debe contar",
  "indispensable",
  "necesario",
  "necesaria",
];

const PALABRAS_DESEABLES = [
  "deseable",
  "deseables",
  "se valorará",
  "se valoran",
  "preferiblemente",
  "plus",
  "valorado",
  "valorada",
  "opcional",
];

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function contieneAlgunaPalabra(texto: string, palabras: string[]) {
  return palabras.some((palabra) =>
    texto.includes(normalizarTexto(palabra))
  );
}

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extraerRequisitos(descripcion: string) {
  const requisitos = new Map<
    string,
    "OBLIGATORIO" | "DESEABLE"
  >();

  const textoNormalizado = normalizarTexto(descripcion);
const oraciones = textoNormalizado.split(/(?<=[!?;])\s+|(?<=\.)\s+(?!js\b)/);
  for (const oracion of oraciones) {
    if (!oracion.trim()) {
      continue;
    }

    const habilidadesEncontradas = [...HABILIDADES_CONOCIDAS]
      .sort((a, b) => b.length - a.length)
      .filter((habilidad) => {
        const habilidadNormalizada = normalizarTexto(habilidad);

        const regex = new RegExp(
          `(?<![a-z0-9+#])${escaparRegex(
            habilidadNormalizada
          )}(?![a-z0-9+#])`
        );

        return regex.test(oracion);
      });

    for (const habilidad of habilidadesEncontradas) {
      const habilidadNormalizada = normalizarTexto(habilidad);

      let tipo: "OBLIGATORIO" | "DESEABLE" = "OBLIGATORIO";

      if (contieneAlgunaPalabra(oracion, PALABRAS_DESEABLES)) {
        tipo = "DESEABLE";
      } else if (
        contieneAlgunaPalabra(oracion, PALABRAS_OBLIGATORIAS)
      ) {
        tipo = "OBLIGATORIO";
      }

      requisitos.set(habilidadNormalizada, tipo);
    }
  }

  return Array.from(requisitos.entries()).map(
    ([nombreNormalizado, tipo]) => {
      const habilidadOriginal =
        HABILIDADES_CONOCIDAS.find(
          (habilidad) =>
            normalizarTexto(habilidad) === nombreNormalizado
        ) || nombreNormalizado;

      return {
        nombre: habilidadOriginal,
        tipo,
      };
    }
  );
}