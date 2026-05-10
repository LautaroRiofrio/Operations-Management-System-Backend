import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const buildPaginationMeta = (total: number, page: number, pageSize: number) => ({
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize)
});

export const searchStates = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const search = req.query.q?.toString();

    const where = search
      ? { nombre: { contains: search, mode: 'insensitive' as const } }
      : undefined;

    const [states, total] = await Promise.all([
      prisma.estado.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { id: 'asc' }
      }),
      prisma.estado.count({ where })
    ]);

    res.json({
      data: states,
      meta: buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar estados' });
  }
};

export const getStateById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const state = await prisma.estado.findUnique({
      where: { id: Number(id) }
    });

    if (!state) {
      return res.status(404).json({ error: 'Estado no encontrado' });
    }

    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar estado' });
  }
};

export const saveState = async (req: any, res: any) => {
  try {
    const { nombre, es_final } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const state = await prisma.estado.create({
      data: {
        nombre: String(nombre),
        es_final: Boolean(es_final)
      }
    });

    res.status(201).json(state);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear estado' });
  }
};

export const updateState = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { nombre, es_final } = req.body;

    const state = await prisma.estado.findUnique({
      where: { id: Number(id) }
    });

    if (!state) {
      return res.status(404).json({ error: 'Estado no encontrado' });
    }

    const updatedState = await prisma.estado.update({
      where: { id: Number(id) },
      data: {
        nombre: nombre !== undefined ? String(nombre) : undefined,
        es_final: es_final !== undefined ? Boolean(es_final) : undefined
      }
    });

    res.json(updatedState);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

export const deleteState = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const [state, orderInCurrentState, usedInHistory] = await Promise.all([
      prisma.estado.findUnique({
        where: { id: Number(id) }
      }),
      prisma.orden.findFirst({
        where: { id_estado_actual: Number(id) }
      }),
      prisma.historial_Estado_Orden.findFirst({
        where: { id_estado: Number(id) }
      })
    ]);

    if (!state) {
      return res.status(404).json({ error: 'Estado no encontrado' });
    }

    if (orderInCurrentState || usedInHistory) {
      return res.status(400).json({
        error: 'No se puede eliminar el estado porque está asociado a órdenes o historial.'
      });
    }

    await prisma.estado.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Estado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar estado' });
  }
};
