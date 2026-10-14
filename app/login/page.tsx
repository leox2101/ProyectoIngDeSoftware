"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Aviso from "../components/Aviso";
import { avisarCambioDeSesion, mensajeDeError, pedir, type Usuario } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const datos = await pedir<{ usuario: Usuario }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena }),
      });

      avisarCambioDeSesion();
      router.push(datos.usuario.rol === "CANDIDATO" ? "/candidato" : "/empresa");
    } catch (e) {
      setError(mensajeDeError(e));
      setCargando(false);
    }
  }

  return (
    <div className="auth">
      <div className="encabezado-pagina">
        <h1>Inicia sesión</h1>
        <p className="texto-suave">
          Entra con el correo con el que te registraste.
        </p>
      </div>

      <form className="hoja formulario" onSubmit={iniciarSesion}>
        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        {error && <Aviso tipo="error">{error}</Aviso>}

        <button type="submit" className="boton" disabled={cargando}>
          {cargando ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>

        <p className="texto-suave pequeno">
          ¿Aún no tienes cuenta? <Link href="/#registro">Crea una</Link>
        </p>
      </form>
    </div>
  );
}
