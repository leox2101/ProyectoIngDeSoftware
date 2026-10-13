
"use client";

import { FormEvent, useState } from "react";

export default function EmpresaPage() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [correoContacto, setCorreoContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [enlacePostulacion, setEnlacePostulacion] = useState("");
  const [requisitosObligatorios, setRequisitosObligatorios] = useState("");
  const [requisitosDeseables, setRequisitosDeseables] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crearVacante(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    setMensaje("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/vacantes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          ubicacion,
          correoContacto,
          telefonoContacto,
          enlacePostulacion,
          requisitosObligatorios: requisitosObligatorios
            .split(",")
            .map((requisito) => requisito.trim())
            .filter((requisito) => requisito.length > 0),
          requisitosDeseables: requisitosDeseables
            .split(",")
            .map((requisito) => requisito.trim())
            .filter((requisito) => requisito.length > 0),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(datos.error || "No se pudo crear la vacante");
        return;
      }

      setMensaje("Vacante creada correctamente");

      setTitulo("");
      setDescripcion("");
      setUbicacion("");
      setCorreoContacto("");
      setTelefonoContacto("");
      setEnlacePostulacion("");
      setRequisitosObligatorios("");
      setRequisitosDeseables("");
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main>
      <h1>Panel de la Empresa</h1>

      <p>Publica una nueva vacante</p>

      <form onSubmit={crearVacante}>
        <input
          type="text"
          placeholder="Título de la vacante"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />

        <textarea
          placeholder="Descripción de la vacante"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Ubicación"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
        />

        <h2>Contacto</h2>

        <input
          type="email"
          placeholder="Correo de contacto"
          value={correoContacto}
          onChange={(e) => setCorreoContacto(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Teléfono de contacto"
          value={telefonoContacto}
          onChange={(e) => setTelefonoContacto(e.target.value)}
        />

        <input
          type="url"
          placeholder="Enlace para postularse"
          value={enlacePostulacion}
          onChange={(e) => setEnlacePostulacion(e.target.value)}
        />

        <h2>Requisitos</h2>

        <input
          type="text"
          placeholder="Obligatorios: JavaScript, React, PostgreSQL"
          value={requisitosObligatorios}
          onChange={(e) => setRequisitosObligatorios(e.target.value)}
        />

        <input
          type="text"
          placeholder="Deseables: TypeScript, Git, Docker"
          value={requisitosDeseables}
          onChange={(e) => setRequisitosDeseables(e.target.value)}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Publicando..." : "Publicar vacante"}
        </button>

        {mensaje && <p>{mensaje}</p>}
      </form>
    </main>
  );
}

