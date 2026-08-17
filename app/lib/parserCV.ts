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

export function extraerHabilidades(texto: string): string[] {
  const textoNormalizado = texto.toLowerCase();

  return habilidadesConocidas.filter((habilidad) =>
    textoNormalizado.includes(habilidad.toLowerCase())
  );
}