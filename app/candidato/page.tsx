
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

    if (archivoSeleccionado) {
      setArchivo(archivoSeleccionado);
      setMensaje("");
      setTextoExtraido("");
    }
  }

  async function subirCV() {
    if (!archivo) {
      setMensaje("Selecciona un archivo PDF");
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
        setMensaje(datos.error || "No se pudo procesar el CV");
        return;
      }

      setMensaje("CV procesado correctamente");
      setTextoExtraido(datos.textoExtraido);

      await cargarCoincidencias();
    } catch {
      setMensaje("No se pudo conectar con el servidor");
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
        setMensaje(datos.error || "No se pudieron cargar las vacantes");
        return;
      }

      setResultados(datos.resultados || []);
    } catch {
      setMensaje("No se pudieron cargar las vacantes");
    } finally {
      setCargandoVacantes(false);
    }
  }

  useEffect(() => {
    cargarCoincidencias();
  }, []);

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

        {cargandoVacantes && <p>Cargando vacantes...</p>}

        {!cargandoVacantes && resultados.length === 0 && (
          <p>No hay vacantes disponibles.</p>
        )}

        {!cargandoVacantes &&
          resultados.map((resultado) => (
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

              <p>
                Requisitos obligatorios:{" "}
                {resultado.obligatoriosCumplidos}/
                {resultado.obligatoriosTotales}
              </p>

              <p>
                Requisitos deseables:{" "}
                {resultado.deseablesCumplidos}/
                {resultado.deseablesTotales}
              </p>

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
          ))}
      </section>
    </main>
  );
}

