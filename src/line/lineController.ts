import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const includeLine = {
  producto: true,
  orden: {
    include: {
      cliente: true,
      estado_actual: true
    }
  }
};

const resolveLineAmounts = async ({
  id_producto,
  cantidad,
  precio_unitario,
  subtotal
}: {
  id_producto: number;
  cantidad: number;
  precio_unitario?: number;
  subtotal?: number;
}) => {
  const product = await prisma.producto.findUnique({
    where: { id: id_producto }
  });

  if (!product) {
    return { error: 'El producto no existe' };
  }

  const unitPrice = precio_unitario !== undefined ? Number(precio_unitario) : Number(product.precio);
  const quantity = Number(cantidad);
  const lineSubtotal = subtotal !== undefined ? Number(subtotal) : Number((quantity * unitPrice).toFixed(2));

  return {
    product,
    quantity,
    unitPrice,
    lineSubtotal
  };
};

export const searchLinesByOrder = async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const lines = await prisma.linea.findMany({
      where: { id_orden: Number(orderId) },
      include: {
        producto: true
      },
      orderBy: { id: 'asc' }
    });

    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar líneas' });
  }
};

export const getLineById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const line = await prisma.linea.findUnique({
      where: { id: Number(id) },
      include: includeLine
    });

    if (!line) {
      return res.status(404).json({ error: 'Línea no encontrada' });
    }

    res.json(line);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar línea' });
  }
};

export const saveLine = async (req: any, res: any) => {
  try {
    const { id_orden, id_producto, cantidad, precio_unitario, subtotal } = req.body;

    if (!id_orden || !id_producto || cantidad === undefined) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios (id_orden, id_producto, cantidad)'
      });
    }

    const order = await prisma.orden.findUnique({
      where: { id: Number(id_orden) }
    });

    if (!order) {
      return res.status(404).json({ error: 'La orden no existe' });
    }

    const resolved = await resolveLineAmounts({
      id_producto: Number(id_producto),
      cantidad: Number(cantidad),
      precio_unitario: precio_unitario !== undefined ? Number(precio_unitario) : undefined,
      subtotal: subtotal !== undefined ? Number(subtotal) : undefined
    });

    if ('error' in resolved) {
      return res.status(404).json({ error: resolved.error });
    }

    const newLine = await prisma.linea.create({
      data: {
        id_orden: Number(id_orden),
        id_producto: Number(id_producto),
        cantidad: resolved.quantity,
        precio_unitario: resolved.unitPrice,
        subtotal: resolved.lineSubtotal
      },
      include: includeLine
    });

    res.status(201).json(newLine);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear línea' });
  }
};

export const updateLine = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { id_orden, id_producto, cantidad, precio_unitario, subtotal } = req.body;

    const currentLine = await prisma.linea.findUnique({
      where: { id: Number(id) }
    });

    if (!currentLine) {
      return res.status(404).json({ error: 'Línea no encontrada' });
    }

    if (id_orden) {
      const order = await prisma.orden.findUnique({
        where: { id: Number(id_orden) }
      });

      if (!order) {
        return res.status(404).json({ error: 'La orden no existe' });
      }
    }

    const nextProductId = id_producto ? Number(id_producto) : currentLine.id_producto;
    const nextQuantity = cantidad !== undefined ? Number(cantidad) : Number(currentLine.cantidad);

    const resolved = await resolveLineAmounts({
      id_producto: nextProductId,
      cantidad: nextQuantity,
      precio_unitario: precio_unitario !== undefined ? Number(precio_unitario) : Number(currentLine.precio_unitario),
      subtotal: subtotal !== undefined ? Number(subtotal) : undefined
    });

    if ('error' in resolved) {
      return res.status(404).json({ error: resolved.error });
    }

    const updatedLine = await prisma.linea.update({
      where: { id: Number(id) },
      data: {
        id_orden: id_orden ? Number(id_orden) : undefined,
        id_producto: id_producto ? Number(id_producto) : undefined,
        cantidad: resolved.quantity,
        precio_unitario: resolved.unitPrice,
        subtotal: resolved.lineSubtotal
      },
      include: includeLine
    });

    res.json(updatedLine);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar línea' });
  }
};

export const deleteLine = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const line = await prisma.linea.findUnique({
      where: { id: Number(id) }
    });

    if (!line) {
      return res.status(404).json({ error: 'Línea no encontrada' });
    }

    await prisma.linea.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Línea eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar línea' });
  }
};
