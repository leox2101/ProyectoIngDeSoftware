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
    .replace(/[\u0300-\u036f]/g, "");
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

  const habilidadesOrdenadas = [...HABILIDADES_CONOCIDAS].sort(
    (a, b) => b.length - a.length
  );

  for (const habilidad of habilidadesOrdenadas) {
    const habilidadNormalizada = normalizarTexto(habilidad);

    const regex = new RegExp(
      `(?<![a-z0-9+#])${escaparRegex(habilidadNormalizada)}(?![a-z0-9+#])`,
      "gi"
    );

    const coincidencia = regex.exec(textoNormalizado);

    if (!coincidencia) {
      continue;
    }

    const posicion = coincidencia.index;

    const inicio = Math.max(0, posicion - 60);
    const fin = Math.min(
      textoNormalizado.length,
      posicion + habilidadNormalizada.length + 60
    );

    const contexto = textoNormalizado.substring(inicio, fin);

    let tipo: "OBLIGATORIO" | "DESEABLE" = "OBLIGATORIO";

    if (contieneAlgunaPalabra(contexto, PALABRAS_DESEABLES)) {
      tipo = "DESEABLE";
    }

    if (contieneAlgunaPalabra(contexto, PALABRAS_OBLIGATORIAS)) {
      tipo = "OBLIGATORIO";
    }

    requisitos.set(habilidadNormalizada, tipo);
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