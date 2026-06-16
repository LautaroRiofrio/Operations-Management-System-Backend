INSERT INTO "Estado" ("nombre", "es_final")
VALUES
  ('pendiente', false),
  ('en_produccion', false),
  ('listo', false),
  ('cancelado', true),
  ('entregado', true)
ON CONFLICT ("nombre") DO UPDATE
SET "es_final" = EXCLUDED."es_final";

INSERT INTO "Movimiento_Stock_Tipo" ("nombre")
VALUES
  ('salida_operativa'),
  ('en_produccion'),
  ('entregado'),
  ('cancelado_con_perdida')
ON CONFLICT ("nombre") DO NOTHING;
