// src/controllers/orderController.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Buscar órdenes (Lista ligera: id, cliente, fecha, estado)
export const searchOrders = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const orders = await prisma.orden.findMany({
      skip: skip,
      take: pageSize,
      select: {  // "Select" explícito para traer solo lo pedido
        id: true,
        fecha_entrega: true,
        estado: true,
        cliente: {
          select: { id: true, nombre: true, whatsapp: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    const total = await prisma.orden.count();

    res.json({
      data: orders,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar órdenes' });
  }
};

// 2. Obtener orden por ID (Trae todo + líneas y productos)
export const getOrderById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const order = await prisma.orden.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
        lineas: {
          include: {
            producto: true // Trae los detalles del producto en cada línea
          }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar orden' });
  }
};

// 3. Obtener órdenes por cliente (Lista ligera)
export const getOrdersByClient = async (req: any, res: any) => {
  try {
    const { clientId } = req.params;

    const orders = await prisma.orden.findMany({
      where: { id_cliente: Number(clientId) },
      select: {
        id: true,
        fecha_entrega: true,
        estado: true,
        cliente: { select: { id: true, nombre: true } }
      },
      orderBy: { id: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes del cliente' });
  }
};

// 4. Crear nueva orden (SAVE)
export const saveOrder = async (req: any, res: any) => {
  try {
    const { id_cliente, fecha_entrega, estado } = req.body;

    if (!id_cliente) {
      return res.status(400).json({ error: 'El id_cliente es obligatorio' });
    }

    const newOrder = await prisma.orden.create({
      data: {
        id_cliente: Number(id_cliente),
        fecha_entrega: fecha_entrega ? new Date(fecha_entrega) : new Date(),
        estado: estado ? Number(estado) : 1 // 1 = Pendiente por defecto
      },
      include: { cliente: true }
    });

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

// 5. Actualizar orden
export const updateOrder = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { id_cliente, fecha_entrega, estado } = req.body;

    const updatedOrder = await prisma.orden.update({
      where: { id: Number(id) },
      data: {
        id_cliente: id_cliente ? Number(id_cliente) : undefined,
        fecha_entrega: fecha_entrega ? new Date(fecha_entrega) : undefined,
        estado: estado ? Number(estado) : undefined
      },
      include: { cliente: true }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
};

// 6. Eliminar orden
export const deleteOrder = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Verificar si tiene líneas
    const hasLines = await prisma.linea.findFirst({
      where: { id_orden: Number(id) }
    });

    if (hasLines) {
      return res.status(400).json({ error: 'No se puede eliminar la orden porque tiene líneas asociadas.' });
    }

    await prisma.orden.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
};