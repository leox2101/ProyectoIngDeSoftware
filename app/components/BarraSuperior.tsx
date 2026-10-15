"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pedir, type Usuario } from "../lib/api";

export default function BarraSuperior() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [revisado, setRevisado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const datos = await pedir<{ usuario: Usuario }>("/api/sesion");
        if (!cancelado) setUsuario(datos.usuario);
      } catch {
        if (!cancelado) setUsuario(null);
      } finally {
        if (!cancelado) setRevisado(true);
      }
    }

    cargar();
    window.addEventListener("sesion-cambio", cargar);

    return () => {
      cancelado = true;
      window.removeEventListener("sesion-cambio", cargar);
    };
  }, []);

  async function cerrarSesion() {
    try {
      await pedir("/api/logout", { method: "POST" });
    } finally {
      setUsuario(null);
      router.push("/login");
      router.refresh();
    }
  }

  const panel = usuario?.rol === "EMPRESA" ? "/empresa" : "/candidato";

  return (
    <header className="barra">
      <div className="contenedor barra-interior">
        <Link href={usuario ? panel : "/"} className="logo">
          <span className="logo-marca" aria-hidden="true" />
          Portal de Empleo
        </Link>

        <nav className="barra-acciones" aria-label="Cuenta">
          {revisado && usuario && (
            <>
              <span className="barra-usuario">
                {usuario.nombre} (
                {usuario.rol === "EMPRESA" ? "empresa" : "candidato"})
              </span>
              <Link href={panel} className="boton-texto barra-mi-panel">
                Mi panel
              </Link>
              <button
                type="button"
                className="boton boton-secundario"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </>
          )}

          {revisado && !usuario && (
            <>
              <Link href="/login" className="boton-texto">
                Iniciar sesión
              </Link>
              <Link href="/#registro" className="boton">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
