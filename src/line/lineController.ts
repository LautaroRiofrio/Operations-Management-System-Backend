// src/controllers/lineController.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Buscar líneas por orden
export const searchLinesByOrder = async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    const lines = await prisma.linea.findMany({
      where: { id_orden: Number(orderId) },
      include: {
        producto: true // Trae info del producto
      },
      orderBy: { id: 'asc' }
    });

    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar líneas' });
  }
};

// 2. Crear línea (SAVE)
export const saveLine = async (req: any, res: any) => {
  try {
    const { id_orden, id_producto, cantidad } = req.body;

    if (!id_orden || !id_producto || cantidad === undefined) {
      return res.status(400).json({ error: 'Faltan datos obligatorios (id_orden, id_producto, cantidad)' });
    }

    const newLine = await prisma.linea.create({
      data: {
        id_orden: Number(id_orden),
        id_producto: Number(id_producto),
        cantidad: Number(cantidad)
      },
      include: { producto: true }
    });

    res.status(201).json(newLine);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear línea' });
  }
};

// 3. Actualizar línea
export const updateLine = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { id_producto, cantidad } = req.body;

    const updatedLine = await prisma.linea.update({
      where: { id: Number(id) },
      data: {
        id_producto: id_producto ? Number(id_producto) : undefined,
        cantidad: cantidad ? Number(cantidad) : undefined
      },
      include: { producto: true }
    });

    res.json(updatedLine);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar línea' });
  }
};

// 4. Eliminar línea
export const deleteLine = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    await prisma.linea.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Línea eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar línea' });
  }
};