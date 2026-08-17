
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { verificarSesion } from "../../lib/auth";

export async function POST(request: NextRequest) {
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
        { error: "No tienes permiso para crear vacantes" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      titulo,
      descripcion,
      ubicacion,
      correoContacto,
      telefonoContacto,
      enlacePostulacion,
      requisitosObligatorios,
      requisitosDeseables,
    } = body;

    if (!titulo || !descripcion) {
      return NextResponse.json(
        { error: "El título y la descripción son obligatorios" },
        { status: 400 }
      );
    }

    if (!correoContacto && !telefonoContacto && !enlacePostulacion) {
      return NextResponse.json(
        { error: "Debes proporcionar al menos un medio de contacto" },
        { status: 400 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: {
        usuarioId: sesion.usuarioId,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "No se encontró la empresa asociada al usuario" },
        { status: 404 }
      );
    }

    const vacante = await prisma.vacante.create({
      data: {
        empresaId: empresa.id,
        titulo,
        descripcion,
        ubicacion: ubicacion || null,
        correoContacto: correoContacto || null,
        telefonoContacto: telefonoContacto || null,
        enlacePostulacion: enlacePostulacion || null,
        requisitos: {
          create: [
            ...(Array.isArray(requisitosObligatorios)
              ? requisitosObligatorios
                  .filter(
                    (nombre: unknown): nombre is string =>
                      typeof nombre === "string" && nombre.trim().length > 0
                  )
                  .map((nombre: string) => ({
                    nombre: nombre.trim(),
                    tipo: "OBLIGATORIO" as const,
                  }))
              : []),
            ...(Array.isArray(requisitosDeseables)
              ? requisitosDeseables
                  .filter(
                    (nombre: unknown): nombre is string =>
                      typeof nombre === "string" && nombre.trim().length > 0
                  )
                  .map((nombre: string) => ({
                    nombre: nombre.trim(),
                    tipo: "DESEABLE" as const,
                  }))
              : []),
          ],
        },
      },
      include: {
        requisitos: true,
      },
    });

    return NextResponse.json(
      {
        mensaje: "Vacante creada correctamente",
        vacante,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear vacante:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

