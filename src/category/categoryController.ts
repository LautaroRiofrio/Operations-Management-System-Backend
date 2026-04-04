// src/controllers/categoryController.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchCategories = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    
    const search = req.query.q?.toString();

    const categories = await prisma.categoria.findMany({
      skip: skip,
      take: pageSize,
      where: search ? { nombre: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { nombre: 'asc' }
    });

    const total = await prisma.categoria.count();

    res.json({
      data: categories,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar categorías' });
  }
};

export const getCategoryById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const category = await prisma.categoria.findUnique({
      where: { id: Number(id) },
      include: {
        productos: true 
      }
    });

    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar categoría' });
  }
};

export const saveCategory = async (req: any, res: any) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const exists = await prisma.categoria.findFirst({ where: { nombre } });
    if (exists) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const newCategory = await prisma.categoria.create({
      data: { nombre }
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

export const updateCategory = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const categoryExists = await prisma.categoria.findUnique({
      where: { id: Number(id) }
    });

    if (!categoryExists) return res.status(404).json({ error: 'Categoría no encontrada' });

    const updatedCategory = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { nombre }
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

export const deleteCategory = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const hasProducts = await prisma.producto.findFirst({
      where: { id_categoria: Number(id) }
    });

    if (hasProducts) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la categoría porque tiene productos asociados.' 
      });
    }

    await prisma.categoria.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};