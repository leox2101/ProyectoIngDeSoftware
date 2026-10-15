"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Aviso from "../components/Aviso";
import TextoResaltado from "../components/TextoResaltado";
import { extraerRequisitos } from "../lib/extractorRequisitos";
import {
  ErrorApi,
  mensajeDeError,
  pedir,
  type TipoRequisito,
  type Vacante,
} from "../lib/api";

type RequisitoVistaPrevia = {
  nombre: string;
  tipo: TipoRequisito;
  origen: "detectado" | "manual";
};

function separarPorComas(texto: string) {
  return texto
    .split(",")
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 0);
}

const claseTipo = (tipo: TipoRequisito) =>
  tipo === "OBLIGATORIO" ? "obligatorio" : "deseable";

export default function EmpresaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [correoContacto, setCorreoContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [enlacePostulacion, setEnlacePostulacion] = useState("");
  const [requisitosObligatorios, setRequisitosObligatorios] = useState("");
  const [requisitosDeseables, setRequisitosDeseables] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "error" | "exito"; texto: string } | null>(null);
  const [publicando, setPublicando] = useState(false);

  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [cargandoVacantes, setCargandoVacantes] = useState(true);
  const [errorVacantes, setErrorVacantes] = useState("");
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargarVacantes = useCallback(async () => {
    setCargandoVacantes(true);
    setErrorVacantes("");

    try {
      const datos = await pedir<{ vacantes: Vacante[] }>("/api/vacantes");
      setVacantes(datos.vacantes);
    } catch (e) {
      if (e instanceof ErrorApi && (e.estado === 401 || e.estado === 403)) {
        router.replace("/login");
        return;
      }
      setErrorVacantes(mensajeDeError(e));
    } finally {
      setCargandoVacantes(false);
    }
  }, [router]);

  useEffect(() => {
    // Carga inicial de las vacantes de la empresa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarVacantes();
  }, [cargarVacantes]);

  // Vista previa: el mismo extractor que usa el back al guardar la vacante.
  const detectados = useMemo(
    () => extraerRequisitos(`${titulo}. ${descripcion}`),
    [titulo, descripcion]
  );

  const requisitosFinales = useMemo<RequisitoVistaPrevia[]>(() => {
    // Igual que en POST /api/vacantes: los manuales reemplazan a los detectados.
    const mapa = new Map<string, RequisitoVistaPrevia>();

    for (const requisito of detectados) {
      mapa.set(requisito.nombre.toLowerCase(), { ...requisito, origen: "detectado" });
    }
    for (const nombre of separarPorComas(requisitosObligatorios)) {
      mapa.set(nombre.toLowerCase(), { nombre, tipo: "OBLIGATORIO", origen: "manual" });
    }
    for (const nombre of separarPorComas(requisitosDeseables)) {
      mapa.set(nombre.toLowerCase(), { nombre, tipo: "DESEABLE", origen: "manual" });
    }

    return [...mapa.values()];
  }, [detectados, requisitosObligatorios, requisitosDeseables]);

  const terminosVistaPrevia = useMemo(
    () =>
      requisitosFinales.map((requisito) => ({
        texto: requisito.nombre,
        clase: claseTipo(requisito.tipo),
        etiqueta: requisito.tipo === "OBLIGATORIO" ? "Obligatorio" : "Deseable",
      })),
    [requisitosFinales]
  );

  const faltaContacto = !correoContacto && !telefonoContacto && !enlacePostulacion;

  async function crearVacante(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);

    if (faltaContacto) {
      setAviso({
        tipo: "error",
        texto: "Agrega al menos un medio de contacto: correo, teléfono o enlace para postularse.",
      });
      return;
    }

    setPublicando(true);

    try {
      const datos = await pedir<{ vacante: Vacante }>("/api/vacantes", {
        method: "POST",
        body: JSON.stringify({
          titulo,
          descripcion,
          ubicacion,
          correoContacto,
          telefonoContacto,
          enlacePostulacion,
          requisitosObligatorios: separarPorComas(requisitosObligatorios),
          requisitosDeseables: separarPorComas(requisitosDeseables),
        }),
      });

      setAviso({
        tipo: "exito",
        texto: `Vacante publicada con ${datos.vacante.requisitos.length} requisitos.`,
      });
      setTitulo("");
      setDescripcion("");
      setUbicacion("");
      setCorreoContacto("");
      setTelefonoContacto("");
      setEnlacePostulacion("");
      setRequisitosObligatorios("");
      setRequisitosDeseables("");
      await cargarVacantes();
    } catch (e) {
      setAviso({ tipo: "error", texto: mensajeDeError(e) });
    } finally {
      setPublicando(false);
    }
  }

  async function cambiarEstado(vacante: Vacante) {
    setCambiando(vacante.id);
    setErrorVacantes("");

    try {
      const datos = await pedir<{ vacante: Vacante }>(`/api/vacantes/${vacante.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activa: !vacante.activa }),
      });
      setVacantes((actuales) =>
        actuales.map((v) => (v.id === vacante.id ? { ...v, activa: datos.vacante.activa } : v))
      );
    } catch (e) {
      setErrorVacantes(mensajeDeError(e));
    } finally {
      setCambiando(null);
    }
  }

  const activas = vacantes.filter((v) => v.activa).length;

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Publica una vacante</h1>
        <p className="texto-suave">
          Describe el cargo con tus palabras. El portal subraya las tecnologías
          que reconoce: si la frase dice «deseable», «se valorará» o «plus»,
          queda como deseable; si no, como obligatoria.
        </p>
      </div>

      <div className="panel">
        <form className="hoja formulario" onSubmit={crearVacante} aria-labelledby="titulo-form">
          <h2 id="titulo-form" className="oculto-visual">Datos de la vacante</h2>

          <div className="campo">
            <label htmlFor="titulo">Título del cargo</label>
            <input
              id="titulo"
              type="text"
              placeholder="Desarrollador full stack"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              placeholder="Se requiere experiencia con React y PostgreSQL. Se valorará conocer Docker."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="ubicacion">Ubicación</label>
            <input
              id="ubicacion"
              type="text"
              placeholder="Medellín, remoto o híbrido"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
          </div>

          <fieldset>
            <legend>Requisitos adicionales</legend>
            <p className="texto-suave pequeno">
              Opcional. Sepáralos con comas. Si repites uno detectado, prevalece
              lo que escribas aquí.
            </p>
            <div className="fila-2">
              <div className="campo">
                <label htmlFor="obligatorios">Obligatorios</label>
                <input
                  id="obligatorios"
                  type="text"
                  placeholder="JavaScript, Git"
                  value={requisitosObligatorios}
                  onChange={(e) => setRequisitosObligatorios(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="deseables">Deseables</label>
                <input
                  id="deseables"
                  type="text"
                  placeholder="TypeScript, AWS"
                  value={requisitosDeseables}
                  onChange={(e) => setRequisitosDeseables(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Contacto</legend>
            <p className="texto-suave pequeno">Al menos uno es necesario.</p>
            <div className="fila-2">
              <div className="campo">
                <label htmlFor="correoContacto">Correo</label>
                <input
                  id="correoContacto"
                  type="email"
                  value={correoContacto}
                  onChange={(e) => setCorreoContacto(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="telefonoContacto">Teléfono</label>
                <input
                  id="telefonoContacto"
                  type="tel"
                  value={telefonoContacto}
                  onChange={(e) => setTelefonoContacto(e.target.value)}
                />
              </div>
            </div>
            <div className="campo">
              <label htmlFor="enlacePostulacion">Enlace para postularse</label>
              <input
                id="enlacePostulacion"
                type="url"
                placeholder="https://"
                value={enlacePostulacion}
                onChange={(e) => setEnlacePostulacion(e.target.value)}
              />
            </div>
          </fieldset>

          {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

          <button type="submit" className="boton" disabled={publicando}>
            {publicando ? "Publicando…" : "Publicar vacante"}
          </button>
        </form>

        <div className="pila">
          <section className="hoja pila" aria-labelledby="titulo-previa" aria-live="polite">
            <div className="pila-s">
              <h2 id="titulo-previa">Requisitos identificados</h2>
              <div className="leyenda">
                <span><mark className="resaltado obligatorio">Obligatorio</mark></span>
                <span><mark className="resaltado deseable">Deseable</mark></span>
              </div>
            </div>

            {descripcion || titulo ? (
              <TextoResaltado
                className="vista-previa"
                texto={[titulo, descripcion].filter(Boolean).join("\n\n")}
                terminos={terminosVistaPrevia}
              />
            ) : (
              <p className="vista-previa texto-suave">
                Escribe la descripción y aquí verás qué requisitos detecta el portal.
              </p>
            )}

            {requisitosFinales.length > 0 ? (
              <div className="pila-s">
                <h3>Se guardarán {requisitosFinales.length} requisitos</h3>
                <ul className="lista-fragmentos">
                  {requisitosFinales.map((requisito) => (
                    <li key={requisito.nombre.toLowerCase()}>
                      <mark
                        className={`resaltado ${claseTipo(requisito.tipo)}`}
                        title={requisito.origen === "manual" ? "Agregado a mano" : "Detectado en el texto"}
                      >
                        {requisito.nombre}
                      </mark>
                      {requisito.origen === "manual" && (
                        <span className="texto-suave pequeno"> (a mano)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              (descripcion || titulo) && (
                <p className="texto-suave pequeno">
                  Aún no reconocemos tecnologías en el texto. Nómbralas
                  directamente (por ejemplo, Python o SQL) o agrégalas a mano.
                </p>
              )
            )}
          </section>

          <section className="pila" aria-labelledby="titulo-mis-vacantes">
            <div className="fila-entre">
              <h2 id="titulo-mis-vacantes">Tus vacantes</h2>
              {vacantes.length > 0 && (
                <span className="texto-suave pequeno">
                  {activas} activas de {vacantes.length}
                </span>
              )}
            </div>

            {cargandoVacantes && <p className="texto-suave">Cargando vacantes…</p>}

            {errorVacantes && (
              <Aviso tipo="error">
                {errorVacantes}{" "}
                <button type="button" className="boton-texto" onClick={cargarVacantes}>
                  Reintentar
                </button>
              </Aviso>
            )}

            {!cargandoVacantes && !errorVacantes && vacantes.length === 0 && (
              <div className="vacio">
                <h3>Todavía no has publicado vacantes</h3>
                <p className="texto-suave">
                  Completa el formulario y tu primera vacante aparecerá aquí.
                </p>
              </div>
            )}

            {vacantes.length > 0 && (
              <ul className="lista-vacantes">
                {vacantes.map((vacante) => (
                  <li key={vacante.id}>
                    <article className="hoja vacante">
                      <div className="fila-entre">
                        <div className="pila-s">
                          <h3>{vacante.titulo}</h3>
                          <p className="texto-suave pequeno">
                            {vacante.ubicacion || "Sin ubicación"}, publicada el{" "}
                            {new Date(vacante.fechaCreacion).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <span className={`estado ${vacante.activa ? "estado-ok" : "estado-pausa"}`}>
                          {vacante.activa ? "Activa" : "Pausada"}
                        </span>
                      </div>

                      <ul className="lista-fragmentos">
                        {vacante.requisitos.map((requisito) => (
                          <li key={requisito.id}>
                            <mark className={`resaltado ${claseTipo(requisito.tipo)}`}>
                              {requisito.nombre}
                            </mark>
                          </li>
                        ))}
                      </ul>

                      <div className="fila-entre contacto">
                        <span className="texto-suave">
                          {vacante.candidatosEvaluados
                            ? `${vacante.candidatosEvaluados} ${vacante.candidatosEvaluados === 1 ? "candidato evaluado" : "candidatos evaluados"}, ${vacante.candidatosSobre60 ?? 0} con 60 % o más`
                            : "Aún no la ha evaluado ningún candidato"}
                        </span>
                        <button
                          type="button"
                          className="boton boton-secundario"
                          onClick={() => cambiarEstado(vacante)}
                          disabled={cambiando === vacante.id}
                        >
                          {vacante.activa ? "Pausar vacante" : "Activar vacante"}
                        </button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
