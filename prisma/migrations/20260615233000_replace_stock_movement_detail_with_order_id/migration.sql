DELETE FROM "Movimiento_Stock_Detalle";
DELETE FROM "Movimiento_Stock";

ALTER TABLE "Movimiento_Stock"
DROP COLUMN "detalle",
ADD COLUMN "id_order" INTEGER;

ALTER TABLE "Movimiento_Stock"
ADD CONSTRAINT "Movimiento_Stock_id_order_fkey"
FOREIGN KEY ("id_order") REFERENCES "Orden"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
