import { NextResponse } from "next/server";

// Cierra la sesión eliminando la cookie.
export async function POST() {
  const respuesta = NextResponse.json({ mensaje: "Sesión cerrada" });

  respuesta.cookies.set("sesion", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return respuesta;
}
