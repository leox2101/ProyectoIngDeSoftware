import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { verificarSesion } from "../../lib/auth";

// Devuelve el usuario de la sesión activa (lo usa el front para la navegación).
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

    if (!sesion) {
      return NextResponse.json(
        { error: "La sesión expiró, inicia sesión de nuevo" },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: sesion.usuarioId,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "El usuario de la sesión ya no existe" },
        { status: 401 }
      );
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Error consultando la sesión:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
