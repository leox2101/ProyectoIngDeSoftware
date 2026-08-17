import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { crearSesion } from "../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { correo, contrasena } = body;

    if (!correo || !contrasena) {
      return NextResponse.json(
        { error: "El correo y la contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        correo,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      usuario.contrasenaHash
    );

    if (!contrasenaCorrecta) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = await crearSesion(usuario.id, usuario.rol);

    const respuesta = NextResponse.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });

    respuesta.cookies.set("sesion", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return respuesta;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}