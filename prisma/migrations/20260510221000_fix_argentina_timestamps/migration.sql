ALTER TABLE "Orden"
ALTER COLUMN "creacion" TYPE TIMESTAMPTZ(3) USING "creacion" AT TIME ZONE 'America/Argentina/Buenos_Aires',
ALTER COLUMN "creacion" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "entrega_estimada" TYPE TIMESTAMPTZ(3) USING "entrega_estimada" AT TIME ZONE 'America/Argentina/Buenos_Aires',
ALTER COLUMN "entrega_real" TYPE TIMESTAMPTZ(3) USING "entrega_real" AT TIME ZONE 'America/Argentina/Buenos_Aires';

ALTER TABLE "Historial_Estado_Orden"
ALTER COLUMN "inicio" TYPE TIMESTAMPTZ(3) USING "inicio" AT TIME ZONE 'America/Argentina/Buenos_Aires',
ALTER COLUMN "inicio" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "fin" TYPE TIMESTAMPTZ(3) USING "fin" AT TIME ZONE 'America/Argentina/Buenos_Aires';

ALTER TABLE "Movimiento_Stock"
ALTER COLUMN "fecha" TYPE TIMESTAMPTZ(3) USING "fecha" AT TIME ZONE 'America/Argentina/Buenos_Aires',
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;
