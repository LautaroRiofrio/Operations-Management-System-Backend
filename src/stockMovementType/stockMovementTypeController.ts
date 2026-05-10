import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const buildPaginationMeta = (total: number, page: number, pageSize: number) => ({
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize)
});

export const searchStockMovementTypes = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const search = req.query.q?.toString();

    const where = search
      ? { nombre: { contains: search, mode: 'insensitive' as const } }
      : undefined;

    const [types, total] = await Promise.all([
      prisma.movimiento_Stock_Tipo.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { id: 'asc' }
      }),
      prisma.movimiento_Stock_Tipo.count({ where })
    ]);

    res.json({
      data: types,
      meta: buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar tipos de movimiento' });
  }
};

export const getStockMovementTypeById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const type = await prisma.movimiento_Stock_Tipo.findUnique({
      where: { id: Number(id) }
    });

    if (!type) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }

    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar tipo de movimiento' });
  }
};

export const saveStockMovementType = async (req: any, res: any) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const type = await prisma.movimiento_Stock_Tipo.create({
      data: {
        nombre: String(nombre)
      }
    });

    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tipo de movimiento' });
  }
};

export const updateStockMovementType = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const currentType = await prisma.movimiento_Stock_Tipo.findUnique({
      where: { id: Number(id) }
    });

    if (!currentType) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }

    const updatedType = await prisma.movimiento_Stock_Tipo.update({
      where: { id: Number(id) },
      data: {
        nombre: nombre !== undefined ? String(nombre) : undefined
      }
    });

    res.json(updatedType);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tipo de movimiento' });
  }
};

export const deleteStockMovementType = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const [type, usedInMovements] = await Promise.all([
      prisma.movimiento_Stock_Tipo.findUnique({
        where: { id: Number(id) }
      }),
      prisma.movimiento_Stock.findFirst({
        where: { id_tipo_movimiento: Number(id) }
      })
    ]);

    if (!type) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }

    if (usedInMovements) {
      return res.status(400).json({
        error: 'No se puede eliminar el tipo porque tiene movimientos asociados.'
      });
    }

    await prisma.movimiento_Stock_Tipo.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Tipo de movimiento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tipo de movimiento' });
  }
};
