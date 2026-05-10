import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const buildPaginationMeta = (total: number, page: number, pageSize: number) => ({
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize)
});

const stockMovementInclude = {
  tipo_movimiento: true,
  detalles: {
    include: {
      ingrediente: true,
      producto: true
    }
  }
};

const validateMovementDetails = async (details: any[]) => {
  if (!Array.isArray(details) || details.length === 0) {
    return 'Debe enviar al menos un detalle de movimiento.';
  }

  for (const detail of details) {
    const hasIngredient = detail.id_ingrediente !== undefined && detail.id_ingrediente !== null;
    const hasProduct = detail.id_producto !== undefined && detail.id_producto !== null;

    if (!hasIngredient && !hasProduct) {
      return 'Cada detalle debe referenciar un ingrediente o un producto.';
    }

    if (detail.cantidad === undefined || detail.subtotal === undefined || detail.precio_unitario === undefined) {
      return 'Cada detalle debe incluir cantidad, subtotal y precio_unitario.';
    }

    if (hasIngredient) {
      const ingredient = await prisma.ingrediente.findUnique({
        where: { id: Number(detail.id_ingrediente) }
      });

      if (!ingredient) {
        return `El ingrediente ${detail.id_ingrediente} no existe.`;
      }
    }

    if (hasProduct) {
      const product = await prisma.producto.findUnique({
        where: { id: Number(detail.id_producto) }
      });

      if (!product) {
        return `El producto ${detail.id_producto} no existe.`;
      }
    }
  }

  return null;
};

const mapDetailsForCreate = (details: any[]) =>
  details.map((detail) => ({
    id_ingrediente: detail.id_ingrediente !== undefined && detail.id_ingrediente !== null
      ? Number(detail.id_ingrediente)
      : null,
    id_producto: detail.id_producto !== undefined && detail.id_producto !== null
      ? Number(detail.id_producto)
      : null,
    cantidad: Number(detail.cantidad),
    subtotal: Number(detail.subtotal),
    precio_unitario: Number(detail.precio_unitario)
  }));

export const searchStockMovements = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {
      id_tipo_movimiento: req.query.typeId ? Number(req.query.typeId) : undefined,
      detalles: req.query.ingredientId || req.query.productId
        ? {
            some: {
              id_ingrediente: req.query.ingredientId ? Number(req.query.ingredientId) : undefined,
              id_producto: req.query.productId ? Number(req.query.productId) : undefined
            }
          }
        : undefined
    };

    const [movements, total] = await Promise.all([
      prisma.movimiento_Stock.findMany({
        skip,
        take: pageSize,
        where,
        include: stockMovementInclude,
        orderBy: { fecha: 'desc' }
      }),
      prisma.movimiento_Stock.count({ where })
    ]);

    res.json({
      data: movements,
      meta: buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar movimientos de stock' });
  }
};

export const getStockMovementById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const movement = await prisma.movimiento_Stock.findUnique({
      where: { id: Number(id) },
      include: stockMovementInclude
    });

    if (!movement) {
      return res.status(404).json({ error: 'Movimiento de stock no encontrado' });
    }

    res.json(movement);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar movimiento de stock' });
  }
};

export const saveStockMovement = async (req: any, res: any) => {
  try {
    const { id_tipo_movimiento, fecha, detalle, detalles } = req.body;

    if (!id_tipo_movimiento) {
      return res.status(400).json({ error: 'El id_tipo_movimiento es obligatorio' });
    }

    const movementType = await prisma.movimiento_Stock_Tipo.findUnique({
      where: { id: Number(id_tipo_movimiento) }
    });

    if (!movementType) {
      return res.status(404).json({ error: 'El tipo de movimiento no existe' });
    }

    const detailValidationError = await validateMovementDetails(detalles);

    if (detailValidationError) {
      return res.status(400).json({ error: detailValidationError });
    }

    const movement = await prisma.movimiento_Stock.create({
      data: {
        id_tipo_movimiento: Number(id_tipo_movimiento),
        fecha: fecha ? new Date(fecha) : new Date(),
        detalle: detalle !== undefined ? String(detalle) : null,
        detalles: {
          create: mapDetailsForCreate(detalles)
        }
      },
      include: stockMovementInclude
    });

    res.status(201).json(movement);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear movimiento de stock' });
  }
};

export const updateStockMovement = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { id_tipo_movimiento, fecha, detalle, detalles } = req.body;

    const movement = await prisma.movimiento_Stock.findUnique({
      where: { id: Number(id) }
    });

    if (!movement) {
      return res.status(404).json({ error: 'Movimiento de stock no encontrado' });
    }

    if (id_tipo_movimiento) {
      const movementType = await prisma.movimiento_Stock_Tipo.findUnique({
        where: { id: Number(id_tipo_movimiento) }
      });

      if (!movementType) {
        return res.status(404).json({ error: 'El tipo de movimiento no existe' });
      }
    }

    if (detalles !== undefined) {
      const detailValidationError = await validateMovementDetails(detalles);

      if (detailValidationError) {
        return res.status(400).json({ error: detailValidationError });
      }
    }

    const updatedMovement = await prisma.$transaction(async (tx) => {
      await tx.movimiento_Stock.update({
        where: { id: Number(id) },
        data: {
          id_tipo_movimiento: id_tipo_movimiento ? Number(id_tipo_movimiento) : undefined,
          fecha: fecha ? new Date(fecha) : undefined,
          detalle: detalle !== undefined ? String(detalle) : undefined
        }
      });

      if (detalles !== undefined) {
        await tx.movimiento_Stock_Detalle.deleteMany({
          where: { id_movimiento: Number(id) }
        });

        await tx.movimiento_Stock.update({
          where: { id: Number(id) },
          data: {
            detalles: {
              create: mapDetailsForCreate(detalles)
            }
          }
        });
      }

      return tx.movimiento_Stock.findUnique({
        where: { id: Number(id) },
        include: stockMovementInclude
      });
    });

    res.json(updatedMovement);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar movimiento de stock' });
  }
};

export const deleteStockMovement = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const movement = await prisma.movimiento_Stock.findUnique({
      where: { id: Number(id) }
    });

    if (!movement) {
      return res.status(404).json({ error: 'Movimiento de stock no encontrado' });
    }

    await prisma.movimiento_Stock.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Movimiento de stock eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar movimiento de stock' });
  }
};
