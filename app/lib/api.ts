// Cliente del front para hablar con las rutas de /api.
// Centraliza el manejo de errores y los tipos de las respuestas del back.

export type Rol = "CANDIDATO" | "EMPRESA";
export type TipoRequisito = "OBLIGATORIO" | "DESEABLE";

export type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
};

export type RequisitoEvaluado = {
  nombre: string;
  tipo: TipoRequisito;
  cumplido: boolean;
};

export type ResultadoCoincidencia = {
  vacanteId: number;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  correoContacto: string | null;
  telefonoContacto: string | null;
  enlacePostulacion: string | null;
  empresa: string;
  porcentaje: number;
  cumpleRequisitos: boolean;
  cumpleObligatorios: boolean;
  cumpleDeseables: boolean;
  obligatoriosCumplidos: number;
  obligatoriosTotales: number;
  deseablesCumplidos: number;
  deseablesTotales: number;
  requisitos?: RequisitoEvaluado[];
};

export type Educacion = {
  id: number;
  institucion: string;
  titulo: string | null;
  campoEstudio: string | null;
};

export type Experiencia = {
  id: number;
  cargo: string;
  empresa: string | null;
  descripcion: string | null;
};

export type Perfil = {
  nombre: string;
  correo: string;
  cv: {
    nombreArchivo: string;
    textoExtraido: string | null;
    fechaActualizacion: string;
  } | null;
  habilidades: { id: number; nombre: string; fuente: string | null }[];
  educacion: Educacion[];
  experiencias: Experiencia[];
};

export type RespuestaCV = {
  mensaje: string;
  nombreArchivo: string;
  caracteresExtraidos: number;
  habilidadesExtraidas: string[];
  textoExtraido: string;
};

export type Requisito = {
  id: number;
  nombre: string;
  tipo: TipoRequisito;
};

export type Vacante = {
  id: number;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  correoContacto: string | null;
  telefonoContacto: string | null;
  enlacePostulacion: string | null;
  activa: boolean;
  fechaCreacion: string;
  requisitos: Requisito[];
  candidatosEvaluados?: number;
  candidatosSobre60?: number;
};

export class ErrorApi extends Error {
  estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}

export async function pedir<T>(url: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response;

  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers:
        opciones?.body && !(opciones.body instanceof FormData)
          ? { "Content-Type": "application/json", ...opciones?.headers }
          : opciones?.headers,
    });
  } catch {
    throw new ErrorApi(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      0
    );
  }

  let datos: unknown = null;

  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta sin cuerpo JSON
  }

  if (!respuesta.ok) {
    const mensaje =
      datos && typeof datos === "object" && "error" in datos
        ? String((datos as { error: unknown }).error)
        : `El servidor respondió con un error (${respuesta.status}).`;

    throw new ErrorApi(mensaje, respuesta.status);
  }

  return datos as T;
}

export function mensajeDeError(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

// Las páginas protegidas avisan a la barra superior cuando cambia la sesión.
export function avisarCambioDeSesion() {
  window.dispatchEvent(new Event("sesion-cambio"));
}
