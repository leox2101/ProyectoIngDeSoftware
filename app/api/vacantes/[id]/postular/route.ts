
import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { verificarSesion } from "../../../../lib/auth";

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function esCorreoValido(correo: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function construirCorreo(datos: {
  nombre: string;
  correo: string;
  habilidades: string[];
  tituloVacante: string;
  empresa: string;
  porcentaje: number;
}) {
  const habilidades = datos.habilidades.length
    ? datos.habilidades.map((habilidad) => `- ${habilidad}`).join("\n")
    : "No se identificaron habilidades en el perfil del candidato.";

  return [
    `Cordial saludo, ${datos.empresa}:`,
    "",
    `Mi nombre es ${datos.nombre} y me gustaría expresar mi interés en la vacante de ${datos.tituloVacante}.`,
    "",
    "Comparto un resumen de mi perfil:",
    `Nombre: ${datos.nombre}`,
    `Correo: ${datos.correo}`,
    `Compatibilidad estimada con la vacante: ${datos.porcentaje.toFixed(2)}%`,
    "",
    "Habilidades identificadas en mi hoja de vida:",
    habilidades,
    "",
    "Agradezco que puedan considerar mi perfil para el proceso de selección. Quedo atento(a) a cualquier información adicional o a la posibilidad de conversar sobre mi experiencia y conocimientos.",
    "",
    "Muchas gracias por su tiempo.",
    "",
    `Atentamente,\n${datos.nombre}`,
  ].join("\n");
}

function construirCorreoHtml(datos: {
  nombre: string;
  correo: string;
  habilidades: string[];
  tituloVacante: string;
  empresa: string;
  porcentaje: number;
}) {
  const nombre = escaparHtml(datos.nombre);
  const correo = escaparHtml(datos.correo);
  const tituloVacante = escaparHtml(datos.tituloVacante);
  const empresa = escaparHtml(datos.empresa);
  const porcentaje = Math.min(100, Math.max(0, datos.porcentaje));

  const habilidadesHtml = datos.habilidades.length
    ? datos.habilidades
        .map(
          (habilidad) =>
            `<span style="display:inline-block;margin:4px 6px 4px 0;padding:7px 11px;background:#f1edff;color:#5636a8;border-radius:20px;font-size:13px;">${escaparHtml(habilidad)}</span>`
        )
        .join("")
    : '<span style="color:#667085;font-size:14px;">No se identificaron habilidades en el perfil del candidato.</span>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva postulación</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f9;font-family:Arial,Helvetica,sans-serif;color:#25233a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background-color:#39216f;color:#ffffff;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:#d8ccff;">Portal de Empleo</p>
              <h1 style="margin:0;font-size:25px;line-height:1.3;font-weight:700;">Nueva postulación</h1>
              <p style="margin:9px 0 0;font-size:14px;line-height:1.5;color:#e8e1ff;">Un candidato está interesado en formar parte de tu equipo.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 12px;">
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Cordial saludo, <strong>${empresa}</strong>:</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#555268;">Mi nombre es <strong style="color:#29263d;">${nombre}</strong> y me gustaría expresar mi interés en la siguiente oportunidad:</p>
              <div style="margin:22px 0;padding:19px 20px;background:#f8f6ff;border:1px solid #e8e1ff;border-radius:12px;">
                <p style="margin:0 0 6px;font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:#766b91;">Vacante</p>
                <h2 style="margin:0;font-size:20px;line-height:1.4;color:#39216f;">${tituloVacante}</h2>
                <p style="margin:6px 0 0;font-size:14px;color:#625b73;">${empresa}</p>
              </div>
              <h3 style="margin:26px 0 12px;font-size:16px;color:#29263d;">Resumen del perfil</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
                <tr>
                  <td style="padding:9px 0;color:#777386;width:105px;">Nombre</td>
                  <td style="padding:9px 0;color:#29263d;font-weight:600;">${nombre}</td>
                </tr>
                <tr>
                  <td style="padding:9px 0;color:#777386;">Correo</td>
                  <td style="padding:9px 0;"><a href="mailto:${correo}" style="color:#6544b5;text-decoration:none;">${correo}</a></td>
                </tr>
              </table>
              <div style="margin:20px 0;padding:18px 20px;background:#faf9fc;border:1px solid #eeebf3;border-radius:12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:14px;font-weight:600;color:#403b50;">Compatibilidad estimada</td>
                    <td align="right" style="font-size:22px;font-weight:700;color:#5636a8;">${porcentaje.toFixed(2)}%</td>
                  </tr>
                </table>
                <div style="height:9px;margin-top:12px;background:#e9e5f0;border-radius:10px;overflow:hidden;">
                  <div style="height:9px;width:${porcentaje}%;background:#7654c7;border-radius:10px;"></div>
                </div>
                <p style="margin:9px 0 0;font-size:12px;line-height:1.5;color:#777386;">Porcentaje calculado según las habilidades registradas frente a los requisitos de la vacante.</p>
              </div>
              <h3 style="margin:25px 0 10px;font-size:16px;color:#29263d;">Habilidades identificadas</h3>
              <div style="line-height:1.8;">${habilidadesHtml}</div>
              <p style="margin:26px 0 0;font-size:14px;line-height:1.7;color:#555268;">Agradezco que puedan considerar mi perfil para el proceso de selección. Quedo atento(a) a cualquier información adicional o a la posibilidad de conversar sobre mi experiencia y conocimientos.</p>
              <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#555268;">Muchas gracias por su tiempo.</p>
              <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#555268;">Atentamente,<br><strong style="color:#29263d;">${nombre}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background:#faf9fc;border-top:1px solid #eeebf3;">
              <p style="margin:0;font-size:12px;line-height:1.6;text-align:center;color:#898598;">Este mensaje fue enviado a través de Portal de Empleo.<br>Para responder al candidato, utiliza la opción de responder a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
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

    if (!sesion || sesion.rol !== "CANDIDATO") {
      return NextResponse.json(
        { error: "Solo los candidatos pueden postularse a una vacante" },
        { status: 403 }
      );
    }

    const { id } = await ctx.params;
    const vacanteId = Number(id);

    if (!Number.isInteger(vacanteId) || vacanteId <= 0) {
      return NextResponse.json(
        { error: "La vacante indicada no es válida" },
        { status: 400 }
      );
    }

    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: sesion.usuarioId },
      include: {
        usuario: { select: { nombre: true, correo: true } },
        habilidades: { orderBy: { nombre: "asc" } },
      },
    });

    if (!candidato) {
      return NextResponse.json(
        { error: "No se encontró tu perfil de candidato" },
        { status: 404 }
      );
    }

    const vacante = await prisma.vacante.findUnique({
      where: { id: vacanteId },
      include: {
        requisitos: true,
        empresa: {
          include: {
            usuario: { select: { nombre: true, correo: true } },
          },
        },
      },
    });

    if (!vacante || !vacante.activa) {
      return NextResponse.json(
        { error: "La vacante no existe o ya no está activa" },
        { status: 404 }
      );
    }

    // Durante las pruebas, Resend solo permite enviar al correo propietario de la cuenta.
    const correoDestino = "piedrahitamoncadadavid@gmail.com";

    if (!esCorreoValido(correoDestino)) {
      return NextResponse.json(
        {
          error:
            "La vacante no tiene un correo de contacto válido. Solicita a la empresa que lo actualice.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const remitente = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !remitente) {
      console.error(
        "Faltan RESEND_API_KEY o RESEND_FROM_EMAIL en las variables de entorno"
      );

      return NextResponse.json(
        {
          error:
            "El envío de correos todavía no está configurado. Contacta al administrador del portal.",
        },
        { status: 503 }
      );
    }

    // Si ya existe una postulación fallida, se reintenta con el mismo contenido
    // y la misma clave idempotente. Si está pendiente o enviada, no se duplica.
    let postulacion = await prisma.postulacion.findUnique({
      where: {
        candidatoId_vacanteId: {
          candidatoId: candidato.id,
          vacanteId,
        },
      },
    });

    if (postulacion) {
      if (postulacion.estado === "ERROR") {
        // Resend conserva las claves idempotentes durante 24 horas.
        // Pasado ese periodo no reintentamos automáticamente para no arriesgar un duplicado.
        const ventanaIdempotenciaMs = 23 * 60 * 60 * 1000;

        if (
          Date.now() - postulacion.fechaCreacion.getTime() >=
          ventanaIdempotenciaMs
        ) {
          return NextResponse.json(
            {
              error:
                "El intento fallido superó la ventana segura de reintento. El administrador debe verificar el estado del correo en Resend antes de habilitar otro envío.",
            },
            { status: 409 }
          );
        }
      }

      if (postulacion.estado !== "ERROR") {
        return NextResponse.json(
          {
            error:
              postulacion.estado === "ENVIADA"
                ? "Ya te postulaste a esta vacante. No puedes enviar otra postulación."
                : "Tu postulación ya está siendo procesada. Espera un momento.",
            estado: postulacion.estado,
          },
          { status: 409 }
        );
      }

      const reintento = await prisma.postulacion.updateMany({
        where: { id: postulacion.id, estado: "ERROR" },
        data: {
          estado: "PENDIENTE",
          correoDestino,
          ultimoError: null,
          intentos: { increment: 1 },
        },
      });

      if (reintento.count !== 1) {
        return NextResponse.json(
          {
            error:
              "Tu postulación ya está siendo procesada. Espera un momento.",
          },
          { status: 409 }
        );
      }

      postulacion = await prisma.postulacion.findUniqueOrThrow({
        where: { id: postulacion.id },
      });
    } else {
      const habilidadesCandidato = candidato.habilidades.map((habilidad) =>
        normalizarTexto(habilidad.nombre)
      );

      const obligatorios = vacante.requisitos.filter(
        (r) => r.tipo === "OBLIGATORIO"
      );

      const deseables = vacante.requisitos.filter(
        (r) => r.tipo === "DESEABLE"
      );

      const obligatoriosCumplidos = obligatorios.filter((r) =>
        habilidadesCandidato.includes(normalizarTexto(r.nombre))
      ).length;

      const deseablesCumplidos = deseables.filter((r) =>
        habilidadesCandidato.includes(normalizarTexto(r.nombre))
      ).length;

      const porcentajeObligatorios = obligatorios.length
        ? (obligatoriosCumplidos / obligatorios.length) * 100
        : 100;

      const porcentajeDeseables = deseables.length
        ? (deseablesCumplidos / deseables.length) * 100
        : 100;

      const porcentaje = Number(
        (porcentajeObligatorios * 0.6 + porcentajeDeseables * 0.4).toFixed(2)
      );

      const asunto = `Postulación de ${candidato.usuario.nombre} - ${vacante.titulo}`;

      const contenidoCorreo = construirCorreo({
        nombre: candidato.usuario.nombre,
        correo: candidato.usuario.correo,
        habilidades: candidato.habilidades.map(
          (habilidad) => habilidad.nombre
        ),
        tituloVacante: vacante.titulo,
        empresa: vacante.empresa.usuario.nombre,
        porcentaje,
      });

      try {
        postulacion = await prisma.postulacion.create({
          data: {
            candidatoId: candidato.id,
            vacanteId,
            estado: "PENDIENTE",
            correoDestino,
            correoRespuesta: candidato.usuario.correo,
            asunto,
            contenidoCorreo,
            porcentaje,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return NextResponse.json(
            {
              error:
                "Ya existe una postulación para esta vacante. Actualiza la página para ver su estado.",
            },
            { status: 409 }
          );
        }

        throw error;
      }
    }

    // Se genera el HTML en cada intento a partir de los datos actuales del perfil y la vacante.
    const htmlCorreo = construirCorreoHtml({
      nombre: candidato.usuario.nombre,
      correo: candidato.usuario.correo,
      habilidades: candidato.habilidades.map(
        (habilidad) => habilidad.nombre
      ),
      tituloVacante: vacante.titulo,
      empresa: vacante.empresa.usuario.nombre,
      porcentaje: postulacion.porcentaje,
    });

    // La clave estable evita correos duplicados si Resend recibió la petición
    // pero la conexión se interrumpió antes de que nuestra aplicación recibiera la respuesta.
    const claveIdempotencia = `postulacion-${postulacion.id}`;

    let respuestaCorreo: Response;

    try {
      respuestaCorreo = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": claveIdempotencia,
        },
        body: JSON.stringify({
          from: remitente,
          to: [postulacion.correoDestino],
          reply_to: postulacion.correoRespuesta,
          subject: postulacion.asunto,
          text: postulacion.contenidoCorreo,
          html: htmlCorreo,
        }),
      });
    } catch (error) {
      const detalle =
        error instanceof Error
          ? error.message
          : "Error de conexión con Resend";

      await prisma.postulacion.update({
        where: { id: postulacion.id },
        data: { estado: "ERROR", ultimoError: detalle },
      });

      console.error("No se pudo confirmar la respuesta de Resend:", detalle);

      return NextResponse.json(
        {
          error:
            "No pudimos confirmar el envío. Puedes volver a intentarlo sin generar un correo duplicado.",
        },
        { status: 502 }
      );
    }

    if (!respuestaCorreo.ok) {
      const detalle = await respuestaCorreo.text();

      await prisma.postulacion.update({
        where: { id: postulacion.id },
        data: { estado: "ERROR", ultimoError: detalle },
      });

      console.error("Resend rechazó el envío del correo:", detalle);

      return NextResponse.json(
        {
          error:
            "Resend no aceptó el correo. Revisa el destinatario y la configuración del dominio antes de reintentar.",
        },
        { status: 502 }
      );
    }

    const resultadoResend = (await respuestaCorreo.json()) as {
      id?: string;
    };

    const postulacionActualizada = await prisma.postulacion.update({
      where: { id: postulacion.id },
      data: {
        estado: "ENVIADA",
        resendEmailId: resultadoResend.id ?? null,
        ultimoError: null,
      },
    });

    return NextResponse.json({
      mensaje: `Tu postulación para ${vacante.titulo} fue enviada correctamente a ${postulacionActualizada.correoDestino}.`,
      estado: postulacionActualizada.estado,
      fecha: postulacionActualizada.fechaCreacion,
    });
  } catch (error) {
    console.error("Error al enviar la postulación:", error);

    return NextResponse.json(
      { error: "Ocurrió un error al enviar tu postulación" },
      { status: 500 }
    );
  }
}

