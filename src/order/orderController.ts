import { PrismaClient } from '@prisma/client';
import {
  formatArgentinaDateTime,
  getCurrentArgentinaDate,
  parseArgentinaDateTime
} from '../utils/argentinaDateTime';

const prisma = new PrismaClient();

const buildPaginationMeta = (total: number, page: number, pageSize: number) => ({
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize)
});

const mapOrderSummary = (order: any) => ({
  id: order.id,
  metodo_pago: order.metodo_pago,
  creacion: formatArgentinaDateTime(order.creacion),
  entrega_estimada: formatArgentinaDateTime(order.entrega_estimada),
  entrega_real: formatArgentinaDateTime(order.entrega_real),
  total: order.lineas.reduce((sum: number, line: any) => sum + Number(line.subtotal), 0),
  cliente: order.cliente,
  estado_actual: order.estado_actual
});

const mapHistoryEntry = (history: any) => ({
  ...history,
  inicio: formatArgentinaDateTime(history.inicio),
  fin: formatArgentinaDateTime(history.fin)
});

const mapOrderWithDates = (order: any) => ({
  ...order,
  creacion: formatArgentinaDateTime(order.creacion),
  entrega_estimada: formatArgentinaDateTime(order.entrega_estimada),
  entrega_real: formatArgentinaDateTime(order.entrega_real),
  historial_estados: order.historial_estados?.map(mapHistoryEntry)
});

const baseOrderInclude = {
  cliente: true,
  estado_actual: true,
  lineas: {
    include: {
      producto: true
    }
  },
  historial_estados: {
    include: {
      estado: true
    },
    orderBy: {
      inicio: 'desc' as const
    }
  }
};

export const searchOrders = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.orden.findMany({
        skip,
        take: pageSize,
        include: {
          cliente: {
            select: { id: true, nombre: true, whatsapp: true }
          },
          estado_actual: true,
          lineas: {
            select: { subtotal: true }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.orden.count()
    ]);

    res.json({
      data: orders.map(mapOrderSummary),
      meta: buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar órdenes' });
  }
};

export const getOrderById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const order = await prisma.orden.findUnique({
      where: { id: Number(id) },
      include: baseOrderInclude
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({
      ...mapOrderWithDates(order),
      total: order.lineas.reduce((sum, line) => sum + Number(line.subtotal), 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar orden' });
  }
};

export const getOrdersByClient = async (req: any, res: any) => {
  try {
    const { clientId } = req.params;

    const orders = await prisma.orden.findMany({
      where: { id_cliente: Number(clientId) },
      include: {
        cliente: {
          select: { id: true, nombre: true, whatsapp: true }
        },
        estado_actual: true,
        lineas: {
          select: { subtotal: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.json(orders.map(mapOrderSummary));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes del cliente' });
  }
};

export const getOrderHistory = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const order = await prisma.orden.findUnique({
      where: { id: Number(id) },
      select: { id: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const history = await prisma.historial_Estado_Orden.findMany({
      where: { id_orden: Number(id) },
      include: { estado: true },
      orderBy: { inicio: 'desc' }
    });

    res.json(history.map(mapHistoryEntry));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de la orden' });
  }
};

export const saveOrder = async (req: any, res: any) => {
  try {
    const {
      id_cliente,
      id_estado_actual,
      metodo_pago,
      creacion,
      entrega_estimada,
      entrega_real
    } = req.body;

    if (!id_cliente || !id_estado_actual || !metodo_pago || !entrega_estimada) {
      return res.status(400).json({
        error: 'Los campos id_cliente, id_estado_actual, metodo_pago y entrega_estimada son obligatorios'
      });
    }

    const [client, state] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: Number(id_cliente) } }),
      prisma.estado.findUnique({ where: { id: Number(id_estado_actual) } })
    ]);

    if (!client) {
      return res.status(404).json({ error: 'El cliente no existe' });
    }

    if (!state) {
      return res.status(404).json({ error: 'El estado indicado no existe' });
    }

    const creationDate = creacion ? parseArgentinaDateTime(creacion) : getCurrentArgentinaDate();
    const realDeliveryDate = entrega_real
      ? parseArgentinaDateTime(entrega_real)
      : (state.es_final ? creationDate : null);

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.orden.create({
        data: {
          id_cliente: Number(id_cliente),
          id_estado_actual: Number(id_estado_actual),
          metodo_pago: String(metodo_pago),
          creacion: creationDate,
          entrega_estimada: parseArgentinaDateTime(entrega_estimada),
          entrega_real: realDeliveryDate
        }
      });

      await tx.historial_Estado_Orden.create({
        data: {
          id_orden: order.id,
          id_estado: Number(id_estado_actual),
          inicio: creationDate
        }
      });

      return tx.orden.findUnique({
        where: { id: order.id },
        include: baseOrderInclude
      });
    });

    res.status(201).json({
      ...mapOrderWithDates(newOrder),
      total: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

export const updateOrder = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const {
      id_cliente,
      id_estado_actual,
      metodo_pago,
      creacion,
      entrega_estimada,
      entrega_real
    } = req.body;

    const order = await prisma.orden.findUnique({
      where: { id: Number(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (id_cliente) {
      const client = await prisma.cliente.findUnique({
        where: { id: Number(id_cliente) }
      });

      if (!client) {
        return res.status(404).json({ error: 'El cliente no existe' });
      }
    }

    let requestedState = null;

    if (id_estado_actual) {
      requestedState = await prisma.estado.findUnique({
        where: { id: Number(id_estado_actual) }
      });

      if (!requestedState) {
        return res.status(404).json({ error: 'El estado indicado no existe' });
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const nextStateId = id_estado_actual ? Number(id_estado_actual) : order.id_estado_actual;
      const stateChanged = nextStateId !== order.id_estado_actual;
      const transitionDate = entrega_real ? parseArgentinaDateTime(entrega_real) : getCurrentArgentinaDate();
      const nextRealDeliveryValue = Object.prototype.hasOwnProperty.call(req.body, 'entrega_real')
        ? (entrega_real ? parseArgentinaDateTime(entrega_real) : null)
        : (requestedState?.es_final && stateChanged ? transitionDate : undefined);

      if (stateChanged) {
        await tx.historial_Estado_Orden.updateMany({
          where: {
            id_orden: Number(id),
            fin: null
          },
          data: {
            fin: transitionDate
          }
        });
      }

      await tx.orden.update({
        where: { id: Number(id) },
        data: {
          id_cliente: id_cliente ? Number(id_cliente) : undefined,
          id_estado_actual: id_estado_actual ? Number(id_estado_actual) : undefined,
          metodo_pago: metodo_pago !== undefined ? String(metodo_pago) : undefined,
          creacion: creacion ? parseArgentinaDateTime(creacion) : undefined,
          entrega_estimada: entrega_estimada ? parseArgentinaDateTime(entrega_estimada) : undefined,
          entrega_real: nextRealDeliveryValue
        }
      });

      if (stateChanged) {
        await tx.historial_Estado_Orden.create({
          data: {
            id_orden: Number(id),
            id_estado: nextStateId,
            inicio: transitionDate
          }
        });
      }

      return tx.orden.findUnique({
        where: { id: Number(id) },
        include: baseOrderInclude
      });
    });

    res.json({
      ...mapOrderWithDates(updatedOrder),
      total: updatedOrder?.lineas.reduce((sum, line) => sum + Number(line.subtotal), 0) ?? 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
};

export const deleteOrder = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const order = await prisma.orden.findUnique({
      where: { id: Number(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    await prisma.orden.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
};

export const searchOrdersByState = async (req: any, res: any) => {
  try {
    const { state } = req.params;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where = {
      id_estado_actual: Number(state)
    };

    const [orders, total] = await Promise.all([
      prisma.orden.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          cliente: {
            select: { id: true, nombre: true, whatsapp: true }
          },
          estado_actual: true,
          lineas: {
            select: { subtotal: true }
          }
        },
        orderBy: { id: 'desc' }
      }),
      prisma.orden.count({ where })
    ]);

    res.json({
      data: orders.map(mapOrderSummary),
      meta: buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar órdenes por estado' });
  }
};
