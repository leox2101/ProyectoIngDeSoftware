import { segmentar, type Termino } from "../lib/resaltado";

type Props = {
  texto: string;
  terminos: Termino[];
  className?: string;
};

// Muestra un texto con los fragmentos identificados marcados con resaltador.
export default function TextoResaltado({ texto, terminos, className }: Props) {
  const segmentos = segmentar(texto, terminos);

  return (
    <div className={className}>
      {segmentos.map((segmento, indice) =>
        segmento.tipo === "texto" ? (
          <span key={indice}>{segmento.texto}</span>
        ) : (
          <mark
            key={indice}
            className={`resaltado ${segmento.clase}`}
            title={segmento.etiqueta}
          >
            {segmento.texto}
          </mark>
        )
      )}
    </div>
  );
}
