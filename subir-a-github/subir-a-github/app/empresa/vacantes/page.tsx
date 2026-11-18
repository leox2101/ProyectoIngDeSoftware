"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Aviso from "../../components/Aviso";
import { ErrorApi, mensajeDeError, pedir, type Vacante } from "../../lib/api";

type Filtro = "todas" | "activas" | "pausadas";

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "activas", etiqueta: "Activas" },
  { valor: "pausadas", etiqueta: "Pausadas" },
];

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdministrarVacantesPage() {
  const router = useRouter();
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "error" | "exito"; texto: string } | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [procesando, setProcesando] = useState<number | null>(null);
  const [porEliminar, setPorEliminar] = useState<Vacante | null>(null);
  const botonCancelar = useRef<HTMLButtonElement>(null);

  const cargarVacantes = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const datos = await pedir<{ vacantes: Vacante[] }>("/api/vacantes");
      setVacantes(datos.vacantes);
    } catch (e) {
      if (e instanceof ErrorApi && (e.estado === 401 || e.estado === 403)) {
        router.replace("/login");
        return;
      }
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    // Carga inicial de las vacantes de la empresa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarVacantes();
  }, [cargarVacantes]);

  // El diálogo de confirmación se cierra con Escape y enfoca "Cancelar" al abrirse.
  useEffect(() => {
    if (!porEliminar) return;

    botonCancelar.current?.focus();

    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setPorEliminar(null);
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [porEliminar]);

  const resumen = useMemo(() => {
    const activas = vacantes.filter((v) => v.activa).length;
    return {
      total: vacantes.length,
      activas,
      pausadas: vacantes.length - activas,
      evaluados: vacantes.reduce((suma, v) => suma + (v.candidatosEvaluados ?? 0), 0),
    };
  }, [vacantes]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return vacantes.filter((vacante) => {
      if (filtro === "activas" && !vacante.activa) return false;
      if (filtro === "pausadas" && vacante.activa) return false;
      if (!texto) return true;

      return (
        vacante.titulo.toLowerCase().includes(texto) ||
        (vacante.ubicacion ?? "").toLowerCase().includes(texto)
      );
    });
  }, [vacantes, filtro, busqueda]);

  async function cambiarEstado(vacante: Vacante) {
    setProcesando(vacante.id);
    setAviso(null);

    try {
      const datos = await pedir<{ vacante: Vacante }>(`/api/vacantes/${vacante.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activa: !vacante.activa }),
      });
      setVacantes((actuales) =>
        actuales.map((v) => (v.id === vacante.id ? { ...v, activa: datos.vacante.activa } : v))
      );
      setAviso({
        tipo: "exito",
        texto: `«${vacante.titulo}» quedó ${datos.vacante.activa ? "activa" : "pausada"}.`,
      });
    } catch (e) {
      setAviso({ tipo: "error", texto: mensajeDeError(e) });
    } finally {
      setProcesando(null);
    }
  }

  async function eliminarVacante() {
    if (!porEliminar) return;

    const vacante = porEliminar;
    setProcesando(vacante.id);
    setAviso(null);

    try {
      await pedir(`/api/vacantes/${vacante.id}`, { method: "DELETE" });
      setVacantes((actuales) => actuales.filter((v) => v.id !== vacante.id));
      setAviso({ tipo: "exito", texto: `Se eliminó la vacante «${vacante.titulo}».` });
      setPorEliminar(null);
    } catch (e) {
      setAviso({ tipo: "error", texto: mensajeDeError(e) });
      setPorEliminar(null);
    } finally {
      setProcesando(null);
    }
  }

  return (
    <>
      <div className="encabezado-pagina">
        <div className="fila-entre">
          <h1>Administrar vacantes</h1>
          <Link href="/empresa" className="boton boton-acento">
            Publicar nueva vacante
          </Link>
        </div>
        <p className="texto-suave">
          Revisa todas las vacantes que has creado, pausa las que ya no estén
          recibiendo candidatos o elimínalas de forma definitiva.
        </p>
      </div>

      <section className="resumen-vacantes" aria-label="Resumen de tus vacantes">
        <div className="tarjeta-resumen">
          <span className="tarjeta-cifra">{resumen.total}</span>
          <span className="texto-suave pequeno">Vacantes creadas</span>
        </div>
        <div className="tarjeta-resumen tarjeta-ok">
          <span className="tarjeta-cifra">{resumen.activas}</span>
          <span className="texto-suave pequeno">Activas</span>
        </div>
        <div className="tarjeta-resumen tarjeta-pausa">
          <span className="tarjeta-cifra">{resumen.pausadas}</span>
          <span className="texto-suave pequeno">Pausadas</span>
        </div>
        <div className="tarjeta-resumen tarjeta-info">
          <span className="tarjeta-cifra">{resumen.evaluados}</span>
          <span className="texto-suave pequeno">Evaluaciones de candidatos</span>
        </div>
      </section>

      <section className="hoja pila" aria-labelledby="titulo-listado">
        <div className="fila-entre barra-filtros">
          <h2 id="titulo-listado">Tus vacantes</h2>
          <div className="fila-filtros">
            <div className="pestanas" role="group" aria-label="Filtrar por estado">
              {FILTROS.map(({ valor, etiqueta }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={filtro === valor}
                  onClick={() => setFiltro(valor)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            <div className="campo campo-busqueda">
              <label htmlFor="busqueda" className="oculto-visual">
                Buscar vacante
              </label>
              <input
                id="busqueda"
                type="search"
                placeholder="Buscar por título o ubicación"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

        {cargando && <p className="texto-suave">Cargando vacantes…</p>}

        {error && (
          <Aviso tipo="error">
            {error}{" "}
            <button type="button" className="boton-texto" onClick={cargarVacantes}>
              Reintentar
            </button>
          </Aviso>
        )}

        {!cargando && !error && vacantes.length === 0 && (
          <div className="vacio">
            <h3>Todavía no has creado vacantes</h3>
            <p className="texto-suave">
              Publica tu primera vacante y aparecerá aquí para que la administres.
            </p>
          </div>
        )}

        {!cargando && vacantes.length > 0 && visibles.length === 0 && (
          <p className="texto-suave">No hay vacantes que coincidan con el filtro.</p>
        )}

        {visibles.length > 0 && (
          <div className="tabla-contenedor">
            <table className="tabla-vacantes">
              <thead>
                <tr>
                  <th scope="col">Vacante</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Requisitos</th>
                  <th scope="col">Candidatos</th>
                  <th scope="col">Publicada</th>
                  <th scope="col">
                    <span className="oculto-visual">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((vacante) => {
                  const obligatorios = vacante.requisitos.filter(
                    (r) => r.tipo === "OBLIGATORIO"
                  ).length;
                  const deseables = vacante.requisitos.length - obligatorios;
                  const ocupada = procesando === vacante.id;

                  return (
                    <tr key={vacante.id}>
                      <td data-etiqueta="Vacante">
                        <strong>{vacante.titulo}</strong>
                        <span className="texto-suave pequeno bloque">
                          {vacante.ubicacion || "Sin ubicación"}
                        </span>
                      </td>
                      <td data-etiqueta="Estado">
                        <span className={`estado ${vacante.activa ? "estado-ok" : "estado-pausa"}`}>
                          {vacante.activa ? "Activa" : "Pausada"}
                        </span>
                      </td>
                      <td data-etiqueta="Requisitos">
                        {obligatorios} obligatorios · {deseables} deseables
                      </td>
                      <td data-etiqueta="Candidatos">
                        {vacante.candidatosEvaluados ?? 0} evaluados
                        <span className="texto-suave pequeno bloque">
                          {vacante.candidatosSobre60 ?? 0} con 60 % o más
                        </span>
                      </td>
                      <td data-etiqueta="Publicada">{formatearFecha(vacante.fechaCreacion)}</td>
                      <td className="acciones">
                        <button
                          type="button"
                          className="boton boton-secundario"
                          onClick={() => cambiarEstado(vacante)}
                          disabled={ocupada}
                        >
                          {vacante.activa ? "Pausar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          className="boton boton-peligro"
                          onClick={() => setPorEliminar(vacante)}
                          disabled={ocupada}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {porEliminar && (
        <div className="fondo-dialogo" onClick={() => setPorEliminar(null)}>
          <div
            className="dialogo hoja pila"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-dialogo"
            aria-describedby="texto-dialogo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="titulo-dialogo">¿Eliminar esta vacante?</h2>
            <p id="texto-dialogo" className="texto-suave">
              Vas a eliminar «{porEliminar.titulo}». También se borrarán sus
              requisitos, las coincidencias calculadas y las postulaciones
              recibidas. Esta acción no se puede deshacer.
            </p>
            <div className="fila-acciones">
              <button
                ref={botonCancelar}
                type="button"
                className="boton boton-secundario"
                onClick={() => setPorEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="boton boton-peligro"
                onClick={eliminarVacante}
                disabled={procesando === porEliminar.id}
              >
                {procesando === porEliminar.id ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
