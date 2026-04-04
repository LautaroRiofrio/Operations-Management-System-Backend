import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchRecipes = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const recipes = await prisma.preparacion.findMany({
      skip: skip,
      take: pageSize,
      include: {
        producto: { select: { id: true, nombre: true } },
        ingredientes: {
          include: { ingrediente: { select: { id: true, nombre: true, unidad_medida: true } } }
        }
      },
      orderBy: { id: 'desc' }
    });

    const total = await prisma.preparacion.count();

    res.json({
      data: recipes,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar recetas' });
  }
};

export const getRecipeById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const recipe = await prisma.preparacion.findUnique({
      where: { id: Number(id) },
      include: {
        producto: true,
        ingredientes: {
          include: { ingrediente: true }
        }
      }
    });

    if (!recipe) return res.status(404).json({ error: 'Receta no encontrada' });

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar receta' });
  }
};

export const getRecipeByProductId = async (req: any, res: any) => {
  try {
    const { productId } = req.params;

    const recipe = await prisma.preparacion.findUnique({
      where: { id_producto: Number(productId) },
      include: {
        ingredientes: {
          include: { ingrediente: true }
        }
      }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Este producto no tiene una receta asignada' });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener receta del producto' });
  }
};

export const getRecipeIngredients = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const recipe = await prisma.preparacion.findUnique({
      where: { id: Number(id) },
      select: { ingredientes: true } 
    });

    if (!recipe) return res.status(404).json({ error: 'Receta no encontrada' });

    res.json(recipe.ingredientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ingredientes de la receta' });
  }
};


export const saveRecipe = async (req: any, res: any) => {
  try {
    const { id_producto, ingredientes } = req.body;

    if (!id_producto) {
      return res.status(400).json({ error: 'El id_producto es obligatorio' });
    }

    const product = await prisma.producto.findUnique({
      where: { id: Number(id_producto) }
    });

    if (!product) {
      return res.status(404).json({ error: 'El producto no existe' });
    }

    const newRecipe = await prisma.preparacion.create({
      data: {
        id_producto: Number(id_producto),
        ingredientes: {
          create: ingredientes // Espera un array: [{ id_ingrediente: 1, cantidad: 0.5 }, ...]
        }
      },
      include: {
        producto: true,
        ingredientes: { include: { ingrediente: true } }
      }
    });

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear receta' });
  }
};


export const updateRecipe = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { ingredientes } = req.body; // Array de ingredientes

    const recipe = await prisma.preparacion.findUnique({
      where: { id: Number(id) }
    });

    if (!recipe) return res.status(404).json({ error: 'Receta no encontrada' });

    await prisma.preparacion_Ingrediente.deleteMany({
      where: { id_preparacion: Number(id) }
    });

    const updatedRecipe = await prisma.preparacion.update({
      where: { id: Number(id) },
      data: {
        ingredientes: {
          create: ingredientes
        }
      },
      include: {
        ingredientes: { include: { ingrediente: true } }
      }
    });

    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar receta' });
  }
};

export const deleteRecipe = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    await prisma.preparacion.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Receta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar receta' });
  }
};