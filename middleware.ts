import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "./app/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("sesion")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const sesion = await verificarSesion(token);

  if (!sesion) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const ruta = request.nextUrl.pathname;

  if (ruta.startsWith("/candidato") && sesion.rol !== "CANDIDATO") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (ruta.startsWith("/empresa") && sesion.rol !== "EMPRESA") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/candidato/:path*", "/empresa/:path*"],
};