"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Aviso from "./components/Aviso";
import { avisarCambioDeSesion, mensajeDeError, pedir, type Rol, type Usuario } from "./lib/api";

const FRAGMENTOS_DEMO: { texto: string; clase: string }[] = [
  { texto: "React", clase: "obligatorio" },
  { texto: "PostgreSQL", clase: "obligatorio" },
  { texto: "Docker", clase: "deseable" },
];

export default function Home() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState<Rol>("CANDIDATO");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrarUsuario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      await pedir("/api/registro", {
        method: "POST",
        body: JSON.stringify({ nombre, correo, contrasena, rol }),
      });

      // Al registrarse, se inicia sesión de una vez y se envía al panel.
      const datos = await pedir<{ usuario: Usuario }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena }),
      });

      avisarCambioDeSesion();
      router.push(datos.usuario.rol === "EMPRESA" ? "/empresa" : "/candidato");
    } catch (e) {
      setError(mensajeDeError(e));
      setCargando(false);
    }
  }

  return (
    <div className="portada">
      <section className="portada-texto">
        <h1>Tu hoja de vida, leída como la leería un reclutador.</h1>
        <p>
          Sube tu CV en PDF y el portal identifica tus habilidades, estudios y
          experiencia. Luego compara cada vacante contra lo que sabes hacer:
          primero lo obligatorio, después lo deseable.
        </p>

        <div className="hoja demo" aria-label="Ejemplo de vacante con requisitos identificados">
          <p>
            Buscamos desarrollador web. Se requiere experiencia con{" "}
            {FRAGMENTOS_DEMO.slice(0, 2).map((fragmento, indice) => (
              <span key={fragmento.texto}>
                <mark
                  className={`resaltado ${fragmento.clase}`}
                  style={{ "--orden": indice } as React.CSSProperties}
                >
                  {fragmento.texto}
                </mark>
                {indice === 0 ? " y " : ". "}
              </span>
            ))}
            Se valorará conocer{" "}
            <mark
              className="resaltado deseable"
              style={{ "--orden": 2 } as React.CSSProperties}
            >
              Docker
            </mark>
            .
          </p>
          <div className="demo-pie leyenda">
            <span>
              <mark className="resaltado obligatorio">Obligatorio</mark>
              lo que la vacante exige
            </span>
            <span>
              <mark className="resaltado deseable">Deseable</mark>
              lo que suma puntos
            </span>
          </div>
        </div>

        <ol className="pasos">
          <li>
            <span>
              <strong>Candidatos:</strong> suben su CV y ven qué vacantes
              cumplen, con el porcentaje de coincidencia y lo que les falta.
            </span>
          </li>
          <li>
            <span>
              <strong>Empresas:</strong> describen la vacante y el portal
              detecta los requisitos mientras escriben.
            </span>
          </li>
        </ol>
      </section>

      <section id="registro" className="hoja">
        <form className="formulario" onSubmit={registrarUsuario}>
          <div className="pila-s">
            <h2>Crea tu cuenta</h2>
            <p className="texto-suave pequeno">
              ¿Ya tienes una? <Link href="/login">Inicia sesión</Link>
            </p>
          </div>

          <fieldset>
            <legend className="oculto-visual">Tipo de cuenta</legend>
            <div className="selector-rol">
              <label>
                <input
                  type="radio"
                  name="rol"
                  value="CANDIDATO"
                  checked={rol === "CANDIDATO"}
                  onChange={() => setRol("CANDIDATO")}
                />
                <strong>Busco empleo</strong>
                <span>Subo mi CV</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="rol"
                  value="EMPRESA"
                  checked={rol === "EMPRESA"}
                  onChange={() => setRol("EMPRESA")}
                />
                <strong>Soy empresa</strong>
                <span>Publico vacantes</span>
              </label>
            </div>
          </fieldset>

          <div className="campo">
            <label htmlFor="nombre">
              {rol === "EMPRESA" ? "Nombre de la empresa" : "Nombre completo"}
            </label>
            <input
              id="nombre"
              type="text"
              autoComplete={rol === "EMPRESA" ? "organization" : "name"}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

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
              autoComplete="new-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              minLength={8}
              aria-describedby="ayuda-contrasena"
            />
            <span id="ayuda-contrasena" className="ayuda">
              Mínimo 8 caracteres.
            </span>
          </div>

          {error && (
            <Aviso tipo="error">{error}</Aviso>
          )}

          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
      </section>
    </div>
  );
}
