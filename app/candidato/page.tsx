"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Aviso from "../components/Aviso";
import TextoResaltado from "../components/TextoResaltado";
import {
  ErrorApi,
  mensajeDeError,
  pedir,
  type Perfil,
  type RequisitoEvaluado,
  type RespuestaCV,
  type ResultadoCoincidencia,
} from "../lib/api";
import type { Termino } from "../lib/resaltado";

type Filtro = "cumple" | "todas";

const SECCIONES_CV = ["EDUCACIÓN", "EXPERIENCIA", "HABILIDADES", "TECNOLOGÍAS"];

export default function CandidatoPage() {
  const router = useRouter();
  const entradaArchivo = useRef<HTMLInputElement>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "error" | "exito"; texto: string } | null>(null);

  const [resultados, setResultados] = useState<ResultadoCoincidencia[]>([]);
  const [cargandoVacantes, setCargandoVacantes] = useState(true);
  const [errorVacantes, setErrorVacantes] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("cumple");

  const cargarPerfil = useCallback(async () => {
    try {
      setPerfil(await pedir<Perfil>("/api/perfil"));
    } catch (e) {
      if (e instanceof ErrorApi && (e.estado === 401 || e.estado === 403)) {
        router.replace("/login");
        return;
      }
      setAviso({ tipo: "error", texto: mensajeDeError(e) });
    }
  }, [router]);

  const cargarCoincidencias = useCallback(async () => {
    setCargandoVacantes(true);
    setErrorVacantes("");

    try {
      const datos = await pedir<{ resultados: ResultadoCoincidencia[] }>(
        "/api/coincidencias"
      );
      setResultados(Array.isArray(datos.resultados) ? datos.resultados : []);
    } catch (e) {
      setErrorVacantes(mensajeDeError(e));
      setResultados([]);
    } finally {
      setCargandoVacantes(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial de datos del back al abrir el panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPerfil();
    cargarCoincidencias();
  }, [cargarPerfil, cargarCoincidencias]);

  function elegirArchivo(seleccionado: File | undefined) {
    setAviso(null);

    if (!seleccionado) return;

    if (seleccionado.type !== "application/pdf") {
      setAviso({
        tipo: "error",
        texto: "El archivo debe ser un PDF. Exporta tu hoja de vida a PDF y vuelve a intentarlo.",
      });
      setArchivo(null);
      if (entradaArchivo.current) entradaArchivo.current.value = "";
      return;
    }

    setArchivo(seleccionado);
  }

  function alSeleccionar(evento: ChangeEvent<HTMLInputElement>) {
    elegirArchivo(evento.target.files?.[0]);
  }

  function alSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastrando(false);
    elegirArchivo(evento.dataTransfer.files?.[0]);
  }

  async function subirCV() {
    if (!archivo) return;

    setSubiendo(true);
    setAviso(null);

    const formulario = new FormData();
    formulario.append("cv", archivo);

    try {
      const datos = await pedir<RespuestaCV>("/api/cv", {
        method: "POST",
        body: formulario,
      });

      const total = datos.habilidadesExtraidas.length;
      setAviso({
        tipo: "exito",
        texto:
          total > 0
            ? `CV procesado: identificamos ${total} ${total === 1 ? "habilidad" : "habilidades"}.`
            : "CV procesado, pero no identificamos habilidades técnicas conocidas. Revisa que tu CV las mencione por su nombre (por ejemplo, React o PostgreSQL).",
      });
      setArchivo(null);
      if (entradaArchivo.current) entradaArchivo.current.value = "";

      await Promise.all([cargarPerfil(), cargarCoincidencias()]);
    } catch (e) {
      setAviso({ tipo: "error", texto: mensajeDeError(e) });
    } finally {
      setSubiendo(false);
    }
  }

  // Fragmentos del CV que se subrayan en el texto extraído.
  const terminosCV = useMemo<Termino[]>(() => {
    if (!perfil) return [];

    return [
      ...SECCIONES_CV.map((texto) => ({
        texto,
        clase: "seccion",
        etiqueta: "Sección detectada",
      })),
      ...perfil.educacion
        .filter((e) => e.titulo)
        .map((e) => ({ texto: e.titulo as string, clase: "obligatorio", etiqueta: "Título" })),
      ...perfil.experiencias.map((e) => ({
        texto: e.cargo,
        clase: "obligatorio",
        etiqueta: "Cargo",
      })),
      ...perfil.habilidades.map((h) => ({
        texto: h.nombre,
        clase: "habilidad",
        etiqueta: "Habilidad",
      })),
    ];
  }, [perfil]);

  const cumple = resultados.filter((resultado) => resultado.cumpleRequisitos);
  const visibles = filtro === "cumple" ? cumple : resultados;
  const tieneCV = Boolean(perfil?.cv);

  return (
    <>
      <div className="encabezado-pagina">
        <h1>{perfil ? `Hola, ${perfil.nombre.split(" ")[0]}` : "Tu panel"}</h1>
        <p className="texto-suave">
          Lo que el portal identifica en tu hoja de vida es lo que se compara
          con cada vacante. Si falta algo, actualiza tu CV y vuelve a subirlo.
        </p>
      </div>

      <div className="panel">
        {/* ---------- Columna del CV ---------- */}
        <div className="pila">
          <section className="hoja pila" aria-labelledby="titulo-cv">
            <div className="pila-s">
              <h2 id="titulo-cv">Tu hoja de vida</h2>
              {perfil?.cv ? (
                <p className="texto-suave pequeno">
                  {perfil.cv.nombreArchivo}, actualizada el{" "}
                  {new Date(perfil.cv.fechaActualizacion).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              ) : (
                <p className="texto-suave pequeno">Todavía no has subido tu CV.</p>
              )}
            </div>

            <div
              className={`zona-carga${arrastrando ? " activa" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={alSoltar}
            >
              <p>
                {archivo
                  ? `Listo para subir: ${archivo.name}`
                  : "Arrastra aquí tu CV en PDF o elige el archivo."}
              </p>
              <div className="fila-entre" style={{ justifyContent: "flex-start" }}>
                <label className="boton boton-secundario">
                  {tieneCV ? "Elegir otro PDF" : "Elegir PDF"}
                  <input
                    ref={entradaArchivo}
                    type="file"
                    accept="application/pdf"
                    onChange={alSeleccionar}
                    className="oculto-visual"
                  />
                </label>
                <button
                  type="button"
                  className="boton"
                  onClick={subirCV}
                  disabled={!archivo || subiendo}
                >
                  {subiendo ? "Procesando CV…" : tieneCV ? "Reemplazar CV" : "Subir CV"}
                </button>
              </div>
            </div>

            {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}
          </section>

          {perfil?.cv && (
            <section className="hoja pila" aria-labelledby="titulo-identificado">
              <h2 id="titulo-identificado">Lo que identificamos</h2>

              <div className="pila-s">
                <h3>Habilidades ({perfil.habilidades.length})</h3>
                {perfil.habilidades.length > 0 ? (
                  <ul className="lista-fragmentos">
                    {perfil.habilidades.map((habilidad) => (
                      <li key={habilidad.id}>
                        <mark className="resaltado habilidad">{habilidad.nombre}</mark>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="texto-suave pequeno">
                    No encontramos habilidades técnicas. Nómbralas tal cual en
                    tu CV, por ejemplo JavaScript, Python o Git.
                  </p>
                )}
              </div>

              <div className="pila-s">
                <h3>Educación</h3>
                {perfil.educacion.length > 0 ? (
                  <ul className="lista-simple">
                    {perfil.educacion.map((educacion) => (
                      <li key={educacion.id}>
                        <strong>{educacion.titulo}</strong>
                        <br />
                        <span className="texto-suave pequeno">{educacion.institucion}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="texto-suave pequeno">
                    No encontramos la sección «Educación» o ningún título en ella.
                  </p>
                )}
              </div>

              <div className="pila-s">
                <h3>Experiencia</h3>
                {perfil.experiencias.length > 0 ? (
                  <ul className="lista-simple">
                    {perfil.experiencias.map((experiencia) => (
                      <li key={experiencia.id}>
                        <strong>{experiencia.cargo}</strong>
                        {experiencia.empresa && (
                          <>
                            <br />
                            <span className="texto-suave pequeno">{experiencia.empresa}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="texto-suave pequeno">
                    No encontramos la sección «Experiencia» o ningún cargo en ella.
                  </p>
                )}
              </div>

              {perfil.cv.textoExtraido && (
                <details className="pila-s">
                  <summary className="boton-texto">Ver el texto de tu CV con los fragmentos marcados</summary>
                  <div className="leyenda" style={{ margin: "10px 0" }}>
                    <span><mark className="resaltado habilidad">Habilidad</mark></span>
                    <span><mark className="resaltado obligatorio">Título o cargo</mark></span>
                    <span><mark className="resaltado seccion">Sección</mark></span>
                  </div>
                  <TextoResaltado
                    className="texto-cv"
                    texto={perfil.cv.textoExtraido}
                    terminos={terminosCV}
                  />
                </details>
              )}
            </section>
          )}
        </div>

        {/* ---------- Columna de vacantes ---------- */}
        <section className="pila" aria-labelledby="titulo-vacantes">
          <div className="fila-entre">
            <h2 id="titulo-vacantes">Vacantes para ti</h2>
            <div className="pestanas" role="group" aria-label="Filtrar vacantes">
              <button
                type="button"
                aria-pressed={filtro === "cumple"}
                onClick={() => setFiltro("cumple")}
              >
                Cumplo requisitos ({cumple.length})
              </button>
              <button
                type="button"
                aria-pressed={filtro === "todas"}
                onClick={() => setFiltro("todas")}
              >
                Todas ({resultados.length})
              </button>
            </div>
          </div>

          <p className="texto-suave pequeno">
            Cumples una vacante cuando tienes todos sus requisitos obligatorios y
            al menos uno deseable. El porcentaje pesa 60 % lo obligatorio y 40 %
            lo deseable.
          </p>

          {cargandoVacantes && <p className="texto-suave">Calculando coincidencias…</p>}

          {!cargandoVacantes && errorVacantes && (
            <Aviso tipo="error">
              {errorVacantes}{" "}
              <button type="button" className="boton-texto" onClick={cargarCoincidencias}>
                Reintentar
              </button>
            </Aviso>
          )}

          {!cargandoVacantes && !errorVacantes && visibles.length === 0 && (
            <div className="vacio">
              <h3>
                {resultados.length === 0
                  ? "Aún no hay vacantes publicadas"
                  : "Ninguna vacante coincide del todo"}
              </h3>
              <p className="texto-suave">
                {resultados.length === 0
                  ? "Cuando una empresa publique una vacante, aparecerá aquí con tu porcentaje de coincidencia."
                  : !tieneCV
                    ? "Sube tu CV para que podamos comparar tus habilidades con las vacantes."
                    : "Mira todas las vacantes para ver qué requisitos te faltan en cada una."}
              </p>
              {resultados.length > 0 && filtro === "cumple" && (
                <div>
                  <button type="button" className="boton boton-secundario" onClick={() => setFiltro("todas")}>
                    Ver todas las vacantes
                  </button>
                </div>
              )}
            </div>
          )}

          {!cargandoVacantes && visibles.length > 0 && (
            <ul className="lista-vacantes">
              {visibles.map((resultado) => (
                <li key={resultado.vacanteId}>
                  <TarjetaVacante resultado={resultado} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function ListaRequisitos({
  titulo,
  requisitos,
  cumplidos,
  totales,
}: {
  titulo: string;
  requisitos: RequisitoEvaluado[] | undefined;
  cumplidos: number;
  totales: number;
}) {
  if (totales === 0) return null;

  return (
    <div className="grupo-requisitos">
      <h4>
        {titulo}: {cumplidos} de {totales}
      </h4>
      {requisitos && (
        <ul className="lista-fragmentos">
          {requisitos.map((requisito) => (
            <li key={requisito.nombre}>
              {requisito.cumplido ? (
                <mark
                  className={`resaltado ${requisito.tipo === "OBLIGATORIO" ? "obligatorio" : "deseable"}`}
                  title="Lo tienes"
                >
                  {requisito.nombre}
                </mark>
              ) : (
                <span className="faltante" title="Te falta">
                  {requisito.nombre}
                  <span className="oculto-visual"> (te falta)</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaVacante({ resultado }: { resultado: ResultadoCoincidencia }) {
  const obligatorios = resultado.requisitos?.filter((r) => r.tipo === "OBLIGATORIO");
  const deseables = resultado.requisitos?.filter((r) => r.tipo === "DESEABLE");

  return (
    <article className="hoja vacante">
      <div className="vacante-cabecera">
        <div className="pila-s">
          <h3>{resultado.titulo}</h3>
          <p className="texto-suave pequeno">
            {resultado.empresa}
            {resultado.ubicacion ? `, ${resultado.ubicacion}` : ""}
          </p>
          <div>
            <span className={`estado ${resultado.cumpleRequisitos ? "estado-ok" : "estado-pausa"}`}>
              {resultado.cumpleRequisitos
                ? "Cumples los requisitos"
                : !resultado.cumpleObligatorios
                  ? "Te faltan obligatorios"
                  : "Te falta al menos un deseable"}
            </span>
          </div>
        </div>

        <div className="medidor" aria-label={`${resultado.porcentaje} % de coincidencia`}>
          <span className="medidor-cifra">
            {Math.round(resultado.porcentaje)}
            <small>%</small>
          </span>
          <div className="medidor-barra" aria-hidden="true">
            <span style={{ width: `${Math.min(100, resultado.porcentaje)}%` }} />
          </div>
          <span className="texto-suave pequeno">de coincidencia</span>
        </div>
      </div>

      <p>{resultado.descripcion}</p>

      <div className="pila-s">
        <ListaRequisitos
          titulo="Obligatorios"
          requisitos={obligatorios}
          cumplidos={resultado.obligatoriosCumplidos}
          totales={resultado.obligatoriosTotales}
        />
        <ListaRequisitos
          titulo="Deseables"
          requisitos={deseables}
          cumplidos={resultado.deseablesCumplidos}
          totales={resultado.deseablesTotales}
        />
      </div>

      {(resultado.correoContacto || resultado.telefonoContacto || resultado.enlacePostulacion) && (
        <div className="contacto">
          {resultado.correoContacto && (
            <a href={`mailto:${resultado.correoContacto}`}>{resultado.correoContacto}</a>
          )}
          {resultado.telefonoContacto && (
            <a href={`tel:${resultado.telefonoContacto}`}>{resultado.telefonoContacto}</a>
          )}
          {resultado.enlacePostulacion && (
            <a href={resultado.enlacePostulacion} target="_blank" rel="noopener noreferrer">
              Postularme
            </a>
          )}
        </div>
      )}
    </article>
  );
}
