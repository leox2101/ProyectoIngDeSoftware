import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verificarSesion } from "../../../lib/auth";

// Activa o desactiva una vacante. Solo la empresa dueña puede hacerlo.
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vacantes/[id]">
) {
  try {
    const token = request.cookies.get("sesion")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No estás autenticado" },
        { status: 401 }
      );
    }

    const sesion = await verificarSesion(token);

    if (!sesion || sesion.rol !== "EMPRESA") {
      return NextResponse.json(
        { error: "No tienes permiso para modificar vacantes" },
        { status: 403 }
      );
    }

    const { id } = await ctx.params;
    const vacanteId = Number(id);

    if (!Number.isInteger(vacanteId)) {
      return NextResponse.json(
        { error: "El identificador de la vacante no es válido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (typeof body.activa !== "boolean") {
      return NextResponse.json(
        { error: "Debes indicar si la vacante queda activa (true o false)" },
        { status: 400 }
      );
    }

    const vacante = await prisma.vacante.findFirst({
      where: {
        id: vacanteId,
        empresa: {
          usuarioId: sesion.usuarioId,
        },
      },
    });

    if (!vacante) {
      return NextResponse.json(
        { error: "No se encontró la vacante" },
        { status: 404 }
      );
    }

    const actualizada = await prisma.vacante.update({
      where: { id: vacanteId },
      data: { activa: body.activa },
      include: { requisitos: true },
    });

    return NextResponse.json({
      mensaje: actualizada.activa ? "Vacante activada" : "Vacante pausada",
      vacante: actualizada,
    });
  } catch (error) {
    console.error("Error al actualizar vacante:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
