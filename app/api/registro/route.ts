import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nombre, correo, contrasena, rol } = body;

    if (!nombre || !correo || !contrasena || !rol) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    if (rol !== "CANDIDATO" && rol !== "EMPRESA") {
      return NextResponse.json(
        { error: "El rol debe ser CANDIDATO o EMPRESA" },
        { status: 400 }
      );
    }

    if (contrasena.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        correo,
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 409 }
      );
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        contrasenaHash,
        rol,
        candidato:
          rol === "CANDIDATO"
            ? {
                create: {},
              }
            : undefined,
        empresa:
          rol === "EMPRESA"
            ? {
                create: {},
              }
            : undefined,
      },
    });

    return NextResponse.json(
      {
        mensaje: "Usuario registrado correctamente",
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar usuario:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
