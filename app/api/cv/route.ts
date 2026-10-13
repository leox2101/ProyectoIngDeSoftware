import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { prisma } from "../../lib/prisma";
import { verificarSesion } from "../../lib/auth";
import {
  extraerHabilidades,
  extraerEducacion,
  extraerExperiencia,
} from "../../lib/parserCV";

export const runtime = "nodejs";

type DatosPDF = {
  Pages?: Array<{
    Texts?: Array<{
      R?: Array<{
        T?: string;
      }>;
    }>;
  }>;
};

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

    if (!sesion || sesion.rol !== "CANDIDATO") {
      return NextResponse.json(
        { error: "No tienes permiso para subir un CV" },
        { status: 403 }
      );
    }

    const formulario = await request.formData();
    const archivo = formulario.get("cv");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { error: "Debes enviar un archivo PDF" },
        { status: 400 }
      );
    }

    if (archivo.type !== "application/pdf") {
      return NextResponse.json(
        { error: "El archivo debe ser un PDF" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());

    const textoExtraido = await new Promise<string>((resolve, reject) => {
      const parser = new PDFParser();

      parser.on("pdfParser_dataError", (error: unknown) => {
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error("Error al procesar el PDF"));
        }
      });

      parser.on("pdfParser_dataReady", (pdfData: DatosPDF) => {
        let texto = "";

        for (const pagina of pdfData.Pages ?? []) {
          for (const textoPagina of pagina.Texts ?? []) {
            for (const textoElemento of textoPagina.R ?? []) {
              if (textoElemento.T) {
                texto += decodeURIComponent(textoElemento.T) + " ";
              }
            }

            texto += "\n";
          }

          texto += "\n";
        }

        resolve(texto.trim());
      });

      parser.parseBuffer(buffer);
    });

    const habilidadesExtraidas = extraerHabilidades(textoExtraido);
    const educacionExtraida = extraerEducacion(textoExtraido);
    const experienciaExtraida = extraerExperiencia(textoExtraido);

    let candidato = await prisma.candidato.findUnique({
      where: {
        usuarioId: sesion.usuarioId,
      },
    });

    if (!candidato) {
      candidato = await prisma.candidato.create({
        data: {
          usuarioId: sesion.usuarioId,
        },
      });
    }

    const cvExistente = await prisma.cV.findUnique({
      where: {
        candidatoId: candidato.id,
      },
    });

    if (cvExistente) {
      await prisma.cV.update({
        where: {
          candidatoId: candidato.id,
        },
        data: {
          nombreArchivo: archivo.name,
          textoExtraido,
        },
      });
    } else {
      await prisma.cV.create({
        data: {
          candidatoId: candidato.id,
          nombreArchivo: archivo.name,
          textoExtraido,
        },
      });
    }

    await prisma.habilidadCandidato.deleteMany({
      where: {
        candidatoId: candidato.id,
      },
    });

    if (habilidadesExtraidas.length > 0) {
      await prisma.habilidadCandidato.createMany({
        data: habilidadesExtraidas.map((habilidad) => ({
          candidatoId: candidato.id,
          nombre: habilidad,
          fuente: "CV",
        })),
      });
    }

    await prisma.educacion.deleteMany({
      where: {
        candidatoId: candidato.id,
      },
    });

    if (educacionExtraida.length > 0) {
      await prisma.educacion.createMany({
        data: educacionExtraida.map((educacion) => ({
          candidatoId: candidato.id,
          institucion: educacion.institucion,
          titulo: educacion.titulo,
          campoEstudio: educacion.campoEstudio,
          fechaInicio: educacion.fechaInicio,
          fechaFin: educacion.fechaFin,
        })),
      });
    }

    await prisma.experiencia.deleteMany({
      where: {
        candidatoId: candidato.id,
      },
    });

    if (experienciaExtraida.length > 0) {
      await prisma.experiencia.createMany({
        data: experienciaExtraida.map((experiencia) => ({
          candidatoId: candidato.id,
          cargo: experiencia.cargo,
          empresa: experiencia.empresa,
          descripcion: experiencia.descripcion,
          fechaInicio: experiencia.fechaInicio,
          fechaFin: experiencia.fechaFin,
        })),
      });
    }

    return NextResponse.json({
      mensaje: "CV procesado correctamente",
      nombreArchivo: archivo.name,
      caracteresExtraidos: textoExtraido.length,
      habilidadesExtraidas,
      educacionExtraida,
      experienciaExtraida,
      textoExtraido,
    });
  } catch (error) {
    console.error("Error procesando CV:", error);

    return NextResponse.json(
      { error: "No se pudo procesar el CV" },
      { status: 500 }
    );
  }
}