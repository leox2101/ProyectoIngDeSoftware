import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { verificarSesion } from "../../lib/auth";

// Devuelve lo que se extrajo del CV del candidato: habilidades, educación y experiencia.
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sesion")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

    const sesion = await verificarSesion(token);

    if (!sesion || sesion.rol !== "CANDIDATO") {
      return NextResponse.json(
        { error: "No tienes permiso para consultar este perfil" },
        { status: 403 }
      );
    }

    const candidato = await prisma.candidato.findUnique({
      where: {
        usuarioId: sesion.usuarioId,
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            correo: true,
          },
        },
        cv: true,
        habilidades: {
          orderBy: { nombre: "asc" },
        },
        educacion: true,
        experiencias: true,
      },
    });

    if (!candidato) {
      return NextResponse.json(
        { error: "No se encontró el candidato" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      nombre: candidato.usuario.nombre,
      correo: candidato.usuario.correo,
      cv: candidato.cv
        ? {
            nombreArchivo: candidato.cv.nombreArchivo,
            textoExtraido: candidato.cv.textoExtraido,
            fechaActualizacion: candidato.cv.fechaActualizacion,
          }
        : null,
      habilidades: candidato.habilidades.map((habilidad) => ({
        id: habilidad.id,
        nombre: habilidad.nombre,
        fuente: habilidad.fuente,
      })),
      educacion: candidato.educacion,
      experiencias: candidato.experiencias,
    });
  } catch (error) {
    console.error("Error consultando el perfil:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
