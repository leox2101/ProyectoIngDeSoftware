"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("CANDIDATO");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrarUsuario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          correo,
          contrasena,
          rol,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(datos.error || "No se pudo registrar el usuario");
        return;
      }

      setMensaje("Usuario registrado correctamente");
      setNombre("");
      setCorreo("");
      setContrasena("");
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main>
      <h1>Portal de Empleo</h1>

      <form onSubmit={registrarUsuario}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          minLength={8}
        />

        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="CANDIDATO">Candidato</option>
          <option value="EMPRESA">Empresa</option>
        </select>

        <button type="submit" disabled={cargando}>
          {cargando ? "Registrando..." : "Crear cuenta"}
        </button>

        {mensaje && <p>{mensaje}</p>}
      </form>
    </main>
  );
}