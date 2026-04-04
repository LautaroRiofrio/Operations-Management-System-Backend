import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchIngredients = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    
    const search = req.query.q?.toString();

    const ingredients = await prisma.ingrediente.findMany({
      skip: skip,
      take: pageSize,
      where: search ? { nombre: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { nombre: 'asc' }
    });

    const total = await prisma.ingrediente.count();

    res.json({
      data: ingredients,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar ingredientes' });
  }
};

export const getIngredientById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const ingredient = await prisma.ingrediente.findUnique({
      where: { id: Number(id) }
    });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingrediente no encontrado' });
    }

    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar ingrediente' });
  }
};

export const saveIngredient = async (req: any, res: any) => {
  try {
    const { nombre, unidad_medida } = req.body;

    if (!nombre || !unidad_medida) {
      return res.status(400).json({ error: 'El nombre y la unidad de medida son obligatorios' });
    }

    const exists = await prisma.ingrediente.findFirst({ where: { nombre } });
    if (exists) {
      return res.status(400).json({ error: 'Ya existe un ingrediente con ese nombre' });
    }

    const newIngredient = await prisma.ingrediente.create({
      data: { nombre, unidad_medida }
    });

    res.status(201).json(newIngredient);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ingrediente' });
  }
};

export const updateIngredient = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { nombre, unidad_medida } = req.body;

    const ingredientExists = await prisma.ingrediente.findUnique({
      where: { id: Number(id) }
    });

    if (!ingredientExists) {
      return res.status(404).json({ error: 'Ingrediente no encontrado' });
    }

    const updatedIngredient = await prisma.ingrediente.update({
      where: { id: Number(id) },
      data: { nombre, unidad_medida }
    });

    res.json(updatedIngredient);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ingrediente' });
  }
};

export const deleteIngredient = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const hasDetails = await prisma.detalle_compra.findFirst({
      where: { id_ingrediente: Number(id) }
    });

    if (hasDetails) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el ingrediente porque tiene registros de compra asociados.' 
      });
    }

    await prisma.ingrediente.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Ingrediente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ingrediente' });
  }
};