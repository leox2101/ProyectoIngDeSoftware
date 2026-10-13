import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { verificarSesion } from "../../lib/auth";

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

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
        { error: "No tienes permiso para consultar coincidencias" },
        { status: 403 }
      );
    }

    const candidato = await prisma.candidato.findUnique({
      where: {
        usuarioId: sesion.usuarioId,
      },
      include: {
        habilidades: true,
      },
    });

    if (!candidato) {
      return NextResponse.json(
        { error: "No se encontró el candidato" },
        { status: 404 }
      );
    }

    const vacantes = await prisma.vacante.findMany({
      where: {
        activa: true,
      },
      include: {
        requisitos: true,
        empresa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    const resultados = [];

    for (const vacante of vacantes) {
      const habilidadesCandidato = candidato.habilidades.map((habilidad) =>
        normalizarTexto(habilidad.nombre)
      );

      const obligatorios = vacante.requisitos.filter(
        (requisito) => requisito.tipo === "OBLIGATORIO"
      );

      const deseables = vacante.requisitos.filter(
        (requisito) => requisito.tipo === "DESEABLE"
      );

      let obligatoriosCumplidos = 0;
      let deseablesCumplidos = 0;

      for (const requisito of obligatorios) {
        const requisitoNormalizado = normalizarTexto(requisito.nombre);

        const coincide = habilidadesCandidato.some(
          (habilidad) => habilidad === requisitoNormalizado
        );

        if (coincide) {
          obligatoriosCumplidos++;
        }
      }

      for (const requisito of deseables) {
        const requisitoNormalizado = normalizarTexto(requisito.nombre);

        const coincide = habilidadesCandidato.some(
          (habilidad) => habilidad === requisitoNormalizado
        );

        if (coincide) {
          deseablesCumplidos++;
        }
      }

      const porcentajeObligatorios =
        obligatorios.length > 0
          ? (obligatoriosCumplidos / obligatorios.length) * 100
          : 100;

      const porcentajeDeseables =
        deseables.length > 0
          ? (deseablesCumplidos / deseables.length) * 100
          : 100;

      const porcentaje =
        porcentajeObligatorios * 0.6 + porcentajeDeseables * 0.4;

      const porcentajeFinal = Number(porcentaje.toFixed(2));

      const cumpleObligatorios =
        obligatorios.length === 0 ||
        obligatoriosCumplidos === obligatorios.length;

      const cumpleDeseables =
        deseables.length === 0 || deseablesCumplidos >= 1;

      const cumpleRequisitos =
        cumpleObligatorios && cumpleDeseables;

      await prisma.coincidencia.upsert({
        where: {
          candidatoId_vacanteId: {
            candidatoId: candidato.id,
            vacanteId: vacante.id,
          },
        },
        update: {
          porcentaje: porcentajeFinal,
        },
        create: {
          candidatoId: candidato.id,
          vacanteId: vacante.id,
          porcentaje: porcentajeFinal,
        },
      });

      resultados.push({
        vacanteId: vacante.id,
        titulo: vacante.titulo,
        descripcion: vacante.descripcion,
        ubicacion: vacante.ubicacion,
        correoContacto: vacante.correoContacto,
        telefonoContacto: vacante.telefonoContacto,
        enlacePostulacion: vacante.enlacePostulacion,
        empresa: vacante.empresa.usuario.nombre,
        porcentaje: porcentajeFinal,
        cumpleRequisitos,
        cumpleObligatorios,
        cumpleDeseables,
        obligatoriosCumplidos,
        obligatoriosTotales: obligatorios.length,
        deseablesCumplidos,
        deseablesTotales: deseables.length,
      });
    }

    resultados.sort((a, b) => b.porcentaje - a.porcentaje);

    return NextResponse.json({
      candidatoId: candidato.id,
      resultados,
    });
  } catch (error) {
    console.error("Error calculando coincidencias:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}