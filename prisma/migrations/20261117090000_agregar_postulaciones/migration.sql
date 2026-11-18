CREATE TYPE "EstadoPostulacion" AS ENUM ('PENDIENTE', 'ENVIADA', 'ERROR');

CREATE TABLE "Postulacion" (
    "id" SERIAL NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "vacanteId" INTEGER NOT NULL,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'PENDIENTE',
    "correoDestino" TEXT NOT NULL,
    "correoRespuesta" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenidoCorreo" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "resendEmailId" TEXT,
    "ultimoError" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Postulacion_candidatoId_vacanteId_key"
ON "Postulacion"("candidatoId", "vacanteId");

CREATE INDEX "Postulacion_vacanteId_estado_idx"
ON "Postulacion"("vacanteId", "estado");

CREATE INDEX "Postulacion_candidatoId_fechaCreacion_idx"
ON "Postulacion"("candidatoId", "fechaCreacion");

ALTER TABLE "Postulacion"
ADD CONSTRAINT "Postulacion_candidatoId_fkey"
FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Postulacion"
ADD CONSTRAINT "Postulacion_vacanteId_fkey"
FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
