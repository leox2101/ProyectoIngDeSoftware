ALTER TABLE "Coincidencia"
ADD CONSTRAINT "Coincidencia_porcentaje_check"
CHECK ("porcentaje" >= 0 AND "porcentaje" <= 100);