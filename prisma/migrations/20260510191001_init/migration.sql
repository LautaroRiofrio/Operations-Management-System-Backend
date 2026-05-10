-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "whatsapp" INTEGER NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "id_categoria" INTEGER NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingrediente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,

    CONSTRAINT "Ingrediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estado" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orden" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_estado_actual" INTEGER NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entrega_estimada" TIMESTAMP(3) NOT NULL,
    "entrega_real" TIMESTAMP(3),

    CONSTRAINT "Orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historial_Estado_Orden" (
    "id" SERIAL NOT NULL,
    "id_orden" INTEGER NOT NULL,
    "id_estado" INTEGER NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),

    CONSTRAINT "Historial_Estado_Orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Linea" (
    "id" SERIAL NOT NULL,
    "id_orden" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Linea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento_Stock_Tipo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Movimiento_Stock_Tipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento_Stock" (
    "id" SERIAL NOT NULL,
    "id_tipo_movimiento" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalle" TEXT,

    CONSTRAINT "Movimiento_Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento_Stock_Detalle" (
    "id" SERIAL NOT NULL,
    "id_movimiento" INTEGER NOT NULL,
    "id_ingrediente" INTEGER,
    "id_producto" INTEGER,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Movimiento_Stock_Detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preparacion" (
    "id" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,

    CONSTRAINT "Preparacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preparacion_Ingrediente" (
    "id" SERIAL NOT NULL,
    "id_preparacion" INTEGER NOT NULL,
    "id_ingrediente" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Preparacion_Ingrediente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estado_nombre_key" ON "Estado"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Movimiento_Stock_Tipo_nombre_key" ON "Movimiento_Stock_Tipo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Preparacion_id_producto_key" ON "Preparacion"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "Preparacion_Ingrediente_id_preparacion_id_ingrediente_key" ON "Preparacion_Ingrediente"("id_preparacion", "id_ingrediente");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_id_estado_actual_fkey" FOREIGN KEY ("id_estado_actual") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Estado_Orden" ADD CONSTRAINT "Historial_Estado_Orden_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Estado_Orden" ADD CONSTRAINT "Historial_Estado_Orden_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linea" ADD CONSTRAINT "Linea_id_orden_fkey" FOREIGN KEY ("id_orden") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linea" ADD CONSTRAINT "Linea_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento_Stock" ADD CONSTRAINT "Movimiento_Stock_id_tipo_movimiento_fkey" FOREIGN KEY ("id_tipo_movimiento") REFERENCES "Movimiento_Stock_Tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento_Stock_Detalle" ADD CONSTRAINT "Movimiento_Stock_Detalle_id_movimiento_fkey" FOREIGN KEY ("id_movimiento") REFERENCES "Movimiento_Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento_Stock_Detalle" ADD CONSTRAINT "Movimiento_Stock_Detalle_id_ingrediente_fkey" FOREIGN KEY ("id_ingrediente") REFERENCES "Ingrediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento_Stock_Detalle" ADD CONSTRAINT "Movimiento_Stock_Detalle_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparacion" ADD CONSTRAINT "Preparacion_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparacion_Ingrediente" ADD CONSTRAINT "Preparacion_Ingrediente_id_preparacion_fkey" FOREIGN KEY ("id_preparacion") REFERENCES "Preparacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparacion_Ingrediente" ADD CONSTRAINT "Preparacion_Ingrediente_id_ingrediente_fkey" FOREIGN KEY ("id_ingrediente") REFERENCES "Ingrediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
