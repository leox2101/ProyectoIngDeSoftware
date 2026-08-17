const habilidadesConocidas = [
  "C++",
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "SQL",
  "HTML/CSS",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "Git",
  "GitHub",
  "PostgreSQL",
  "Supabase",
  "MySQL",
  "MongoDB",
  "Docker",
  "AWS",
  "Azure",
  "Firebase",
  "Spring",
  "Angular",
  "Vue",
];

type EducacionExtraida = {
  institucion: string;
  titulo: string;
  campoEstudio: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
};

type ExperienciaExtraida = {
  cargo: string;
  empresa: string | null;
  descripcion: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
};

export function extraerHabilidades(texto: string): string[] {
  const textoNormalizado = texto.toLowerCase();

  return habilidadesConocidas.filter((habilidad) =>
    textoNormalizado.includes(habilidad.toLowerCase())
  );
}

export function extraerEducacion(texto: string): EducacionExtraida[] {
  const resultado: EducacionExtraida[] = [];

  const seccion = texto.match(
    /EDUCACIÓN([\s\S]*?)(?=EXPERIENCIA|HABILIDADES|TECNOLOGÍAS|$)/i
  );

  if (!seccion) {
    return resultado;
  }

  const lineas = seccion[1]
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];

    if (
      linea.match(
        /pregrado|ingeniería|ingenieria|técnico|tecnico|tecnólogo|tecnologo|bachiller/i
      )
    ) {
      resultado.push({
        institucion: lineas[i + 2] || lineas[i + 1] || "No especificada",
        titulo: linea,
        campoEstudio: null,
        fechaInicio: null,
        fechaFin: null,
      });
    }
  }

  return resultado;
}

export function extraerExperiencia(texto: string): ExperienciaExtraida[] {
  const resultado: ExperienciaExtraida[] = [];

  const seccion = texto.match(
    /EXPERIENCIA([\s\S]*?)(?=HABILIDADES|TECNOLOGÍAS|$)/i
  );

  if (!seccion) {
    return resultado;
  }

  const lineas = seccion[1]
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];

    if (
      linea.match(
        /desarrollador|developer|ingeniero|ingeniera|programador|programadora|pasante|practicante|analista|soporte/i
      )
    ) {
      resultado.push({
        cargo: linea,
        empresa: lineas[i + 2] || lineas[i + 1] || null,
        descripcion: lineas.slice(i + 3, i + 6).join(" ") || null,
        fechaInicio: null,
        fechaFin: null,
      });
    }
  }

  return resultado;
}