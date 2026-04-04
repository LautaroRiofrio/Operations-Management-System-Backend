
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchProducts = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const products = await prisma.producto.findMany({
      skip: skip,
      take: pageSize,
      where: {
    
        nombre: req.query.q ? { contains: req.query.q, mode: 'insensitive' } : undefined
      },
      include: {
        categoria: true,           
        preparacion: {             
          include: {
            ingredientes: {
              include: { ingrediente: true }
            }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    const total = await prisma.producto.count();

    res.json({
      data: products,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar productos' });
  }
};


export const getProductById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const product = await prisma.producto.findUnique({
      where: { id: Number(id) },
      include: {
        categoria: true,
        lineas: true, 
        preparacion: {
          include: {
            ingredientes: { include: { ingrediente: true } }
          }
        }
      }
    });

    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar producto' });
  }
};


export const getProductsByCategory = async (req: any, res: any) => {
  try {
    const { categoryId } = req.params;

    const products = await prisma.producto.findMany({
      where: { id_categoria: Number(categoryId) },
      include: { categoria: true },
      orderBy: { nombre: 'asc' }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos de la categoría' });
  }
};

export const saveProduct = async (req: any, res: any) => {
  try {
    const { nombre, id_categoria } = req.body;

    if (!nombre || !id_categoria) {
      return res.status(400).json({ error: 'El nombre y la categoría son obligatorios' });
    }

    const newProduct = await prisma.producto.create({
      data: {
        nombre,
        id_categoria: Number(id_categoria)
      },
      include: { categoria: true }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("ERROR DETALLADO AL CREAR PRODUCTO:", error); // <--- AGREGA ESTO
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const updateProduct = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { nombre, id_categoria } = req.body;

    const productExists = await prisma.producto.findUnique({
      where: { id: Number(id) }
    });

    if (!productExists) return res.status(404).json({ error: 'Producto no encontrado' });

    const updatedProduct = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        nombre,
        id_categoria: id_categoria ? Number(id_categoria) : undefined
      },
      include: { categoria: true }
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const deleteProduct = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const hasOrders = await prisma.linea.findFirst({
      where: { id_producto: Number(id) }
    });

    if (hasOrders) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el producto porque tiene órdenes asociadas.' 
      });
    }

    await prisma.producto.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};