// Divide un texto en segmentos para "subrayar" los fragmentos que el sistema
// identificó (habilidades, requisitos, títulos, secciones del CV).
// Ignora mayúsculas y tildes, y respeta límites de palabra para que
// "Java" no se marque dentro de "JavaScript".

export type Termino = {
  texto: string;
  clase: string;
  etiqueta?: string;
};

export type Segmento =
  | { tipo: "texto"; texto: string }
  | { tipo: "marca"; texto: string; clase: string; etiqueta?: string };

// Quita tildes carácter por carácter sin cambiar la longitud del texto,
// así las posiciones del texto normalizado coinciden con las del original.
function normalizarConservandoLongitud(texto: string) {
  let resultado = "";

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    const base = caracter.normalize("NFD")[0] ?? caracter;
    resultado += base.toLowerCase().length === 1 ? base.toLowerCase() : caracter;
  }

  return resultado;
}

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function segmentar(texto: string, terminos: Termino[]): Segmento[] {
  const validos = terminos
    .map((termino) => ({
      ...termino,
      clave: normalizarConservandoLongitud(termino.texto.trim()),
    }))
    .filter((termino) => termino.clave.length > 0);

  if (!texto || validos.length === 0) {
    return [{ tipo: "texto", texto }];
  }

  // Primero los términos más largos ("Node.js" antes que "Node").
  validos.sort((a, b) => b.clave.length - a.clave.length);

  const porClave = new Map<string, Termino>();
  for (const termino of validos) {
    if (!porClave.has(termino.clave)) {
      porClave.set(termino.clave, termino);
    }
  }

  const patron = new RegExp(
    `(?<![\\p{L}\\p{N}+#])(${[...porClave.keys()]
      .map(escaparRegex)
      .join("|")})(?![\\p{L}\\p{N}+#])`,
    "gu"
  );

  const normalizado = normalizarConservandoLongitud(texto);
  const segmentos: Segmento[] = [];
  let ultimo = 0;

  for (const coincidencia of normalizado.matchAll(patron)) {
    const inicio = coincidencia.index ?? 0;
    const fin = inicio + coincidencia[0].length;
    const termino = porClave.get(coincidencia[0]);

    if (!termino) continue;

    if (inicio > ultimo) {
      segmentos.push({ tipo: "texto", texto: texto.slice(ultimo, inicio) });
    }

    segmentos.push({
      tipo: "marca",
      texto: texto.slice(inicio, fin),
      clase: termino.clase,
      etiqueta: termino.etiqueta,
    });

    ultimo = fin;
  }

  if (ultimo < texto.length) {
    segmentos.push({ tipo: "texto", texto: texto.slice(ultimo) });
  }

  return segmentos;
}
