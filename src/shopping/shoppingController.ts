// src/controllers/shoppingController.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchShoppings = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    
    const providerId = req.query.providerId ? Number(req.query.providerId) : undefined;

    const shoppings = await prisma.compra.findMany({
      skip: skip,
      take: pageSize,
      where: providerId ? { id_proveedor: providerId } : undefined,
      include: {
        proveedor: true, 
      },
      orderBy: {
        fecha_compra: 'desc'
      }
    });

    const total = await prisma.compra.count();

    res.json({
      data: shoppings,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar compras' });
  }
};

export const saveShopping = async (req: any, res: any) => {
  try {
    const { id_proveedor, fecha_compra } = req.body;

    if (!id_proveedor) {
      return res.status(400).json({ error: 'El id_proveedor es obligatorio' });
    }

    const providerExists = await prisma.proveedor.findUnique({
      where: { id: Number(id_proveedor) }
    });

    if (!providerExists) {
      return res.status(404).json({ error: 'El proveedor no existe' });
    }

    const fechaFinal = fecha_compra ? new Date(fecha_compra) : new Date();

    const newShopping = await prisma.compra.create({
      data: {
        id_proveedor: Number(id_proveedor),
        fecha_compra: fechaFinal,
      },
      include: {
        proveedor: true
      }
    });

    res.status(201).json(newShopping);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear compra' });
  }
};

export const getShoppingById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const shopping = await prisma.compra.findUnique({
      where: { id: Number(id) },
      include: {
        proveedor: true,

      }
    });

    if (!shopping) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.json(shopping);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar compra' });
  }
};

export const getShoppingProvider = async (req: any, res: any) => {
  try {
    const { providerId } = req.params;

    const shoppings = await prisma.compra.findMany({
      where: { id_proveedor: Number(providerId) },
      include: { proveedor: true },
      orderBy: { fecha_compra: 'desc' }
    });

    res.json(shoppings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener compras del proveedor' });
  }
};