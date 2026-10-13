"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Resultado = {
  vacanteId: number;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  correoContacto: string | null;
  telefonoContacto: string | null;
  enlacePostulacion: string | null;
  empresa: string;
  porcentaje: number;
  cumpleRequisitos: boolean;
  cumpleObligatorios: boolean;
  cumpleDeseables: boolean;
  obligatoriosCumplidos: number;
  obligatoriosTotales: number;
  deseablesCumplidos: number;
  deseablesTotales: number;
};

export default function CandidatoPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [textoExtraido, setTextoExtraido] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargandoVacantes, setCargandoVacantes] = useState(false);

  function seleccionarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivoSeleccionado = evento.target.files?.[0];

    if (!archivoSeleccionado) {
      return;
    }

    if (archivoSeleccionado.type !== "application/pdf") {
      alert("El archivo seleccionado debe ser un PDF.");
      evento.target.value = "";
      return;
    }

    setArchivo(archivoSeleccionado);
    setMensaje("");
    setTextoExtraido("");
  }

  async function subirCV() {
    if (!archivo) {
      alert("Debes seleccionar un archivo PDF antes de subirlo.");
      return;
    }

    setCargando(true);
    setMensaje("");
    setTextoExtraido("");

    const formulario = new FormData();
    formulario.append("cv", archivo);

    try {
      const respuesta = await fetch("/api/cv", {
        method: "POST",
        body: formulario,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        const error = datos.error || "No se pudo procesar el CV.";

        setMensaje(error);
        alert(`Error al procesar el CV:\n\n${error}`);
        return;
      }

      setMensaje("CV procesado correctamente");
      setTextoExtraido(datos.textoExtraido || "");

      try {
        await cargarCoincidencias();
      } catch {
        alert(
          "El CV fue procesado correctamente, pero ocurrió un error al calcular las coincidencias con las vacantes."
        );
      }
    } catch {
      const error = "No se pudo conectar con el servidor.";

      setMensaje(error);
      alert(`Error:\n\n${error}`);
    } finally {
      setCargando(false);
    }
  }

  async function cargarCoincidencias() {
    setCargandoVacantes(true);

    try {
      const respuesta = await fetch("/api/coincidencias");
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        const error =
          datos.error || "No se pudieron calcular las coincidencias.";

        setMensaje(error);
        setResultados([]);

        alert(`Error en la comparación:\n\n${error}`);

        throw new Error(error);
      }

      if (!Array.isArray(datos.resultados)) {
        const error =
          "El servidor no devolvió resultados válidos para la comparación.";

        setMensaje(error);
        setResultados([]);

        alert(`Error en la comparación:\n\n${error}`);

        throw new Error(error);
      }

      setResultados(datos.resultados);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      const mensajeError = "Ocurrió un error al calcular las coincidencias.";

      setMensaje(mensajeError);
      setResultados([]);

      alert(`Error en la comparación:\n\n${mensajeError}`);

      throw new Error(mensajeError);
    } finally {
      setCargandoVacantes(false);
    }
  }

  useEffect(() => {
    cargarCoincidencias().catch(() => {});
  }, []);

  const vacantesRecomendadas = resultados.filter(
    (resultado) => resultado.cumpleRequisitos
  );

  return (
    <main>
      <h1>Panel del Candidato</h1>

      <p>
        Sube tu hoja de vida para extraer automáticamente tus características.
      </p>

      <input
        type="file"
        accept="application/pdf"
        onChange={seleccionarArchivo}
      />

      {archivo && <p>Archivo seleccionado: {archivo.name}</p>}

      <button onClick={subirCV} disabled={cargando}>
        {cargando ? "Procesando CV..." : "Subir CV"}
      </button>

      {mensaje && <p>{mensaje}</p>}

      {textoExtraido && (
        <section>
          <h2>Texto extraído</h2>
          <pre>{textoExtraido}</pre>
        </section>
      )}

      <section>
        <h2>Vacantes recomendadas</h2>

        {cargandoVacantes && <p>Calculando coincidencias...</p>}

        {!cargandoVacantes && vacantesRecomendadas.length === 0 && (
          <p>No hay vacantes que cumplan todos los requisitos.</p>
        )}

        {!cargandoVacantes &&
          vacantesRecomendadas.map((resultado) => {
            return (
              <article key={resultado.vacanteId}>
                <h3>{resultado.titulo}</h3>

                <p>
                  <strong>Empresa:</strong> {resultado.empresa}
                </p>

                {resultado.ubicacion && (
                  <p>
                    <strong>Ubicación:</strong> {resultado.ubicacion}
                  </p>
                )}

                <p>{resultado.descripcion}</p>

                <h4>{resultado.porcentaje}% de coincidencia</h4>

                <section>
                  <h4>Comparación de requisitos</h4>

                  <p>
                    <strong>Must-Have:</strong>{" "}
                    {resultado.obligatoriosCumplidos}/
                    {resultado.obligatoriosTotales}
                  </p>

                  <p>✓ Cumple todos los requisitos obligatorios</p>

                  <p>
                    <strong>Nice-to-Have:</strong>{" "}
                    {resultado.deseablesCumplidos}/
                    {resultado.deseablesTotales}
                  </p>

                  <p>✓ Cumple al menos un requisito deseable</p>
                </section>

                <div>
                  <h4>Contacto</h4>

                  {resultado.correoContacto && (
                    <p>Correo: {resultado.correoContacto}</p>
                  )}

                  {resultado.telefonoContacto && (
                    <p>Teléfono: {resultado.telefonoContacto}</p>
                  )}

                  {resultado.enlacePostulacion && (
                    <p>
                      <a
                        href={resultado.enlacePostulacion}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Postularme
                      </a>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
      </section>
    </main>
  );
}