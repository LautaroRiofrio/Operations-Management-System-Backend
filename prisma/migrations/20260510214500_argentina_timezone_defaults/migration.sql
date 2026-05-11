ALTER TABLE "Orden"
ALTER COLUMN "creacion"
SET DEFAULT timezone('America/Argentina/Buenos_Aires', now());

ALTER TABLE "Historial_Estado_Orden"
ALTER COLUMN "inicio"
SET DEFAULT timezone('America/Argentina/Buenos_Aires', now());

ALTER TABLE "Movimiento_Stock"
ALTER COLUMN "fecha"
SET DEFAULT timezone('America/Argentina/Buenos_Aires', now());
