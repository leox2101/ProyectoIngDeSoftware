import { SignJWT, jwtVerify } from "jose";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET no está configurado");
}

const secretKey = new TextEncoder().encode(secret);

export async function crearSesion(usuarioId: number, rol: string) {
  return await new SignJWT({
    usuarioId,
    rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verificarSesion(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    return {
      usuarioId: Number(payload.usuarioId),
      rol: String(payload.rol),
    };
  } catch {
    return null;
  }
}