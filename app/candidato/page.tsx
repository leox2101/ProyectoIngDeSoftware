"use client";

import { ChangeEvent, useState } from "react";

export default function CandidatoPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [textoExtraido, setTextoExtraido] = useState("");

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
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

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
    </main>
  );
}