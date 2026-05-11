import { PrismaClient } from '@prisma/client';
import {
  formatArgentinaDateTime,
  getArgentinaDayBounds,
  getArgentinaHour,
  getArgentinaMonthRange
} from '../utils/argentinaDateTime';

const prisma = new PrismaClient();

const DELIVERED_STATE_NAME = 'entregado';

const getDateRangeFromQuery = (query: any) => {
  const startDateRaw = query.startDate ?? query.fechaDesde ?? query.from;
  const endDateRaw = query.endDate ?? query.fechaHasta ?? query.to;

  if ((startDateRaw && !endDateRaw) || (!startDateRaw && endDateRaw)) {
    return {
      error: 'Debes enviar ambas fechas o ninguna.'
    };
  }

  if (!startDateRaw && !endDateRaw) {
    const { startDate, endDate } = getArgentinaMonthRange();

    return {
      startDate,
      endDate,
      usedDefaultRange: true
    };
  }

  let startDate: Date;
  let endDate: Date;

  try {
    startDate = getArgentinaDayBounds(startDateRaw).startDate;
    endDate = getArgentinaDayBounds(endDateRaw).endDate;
  } catch (error) {
    return {
      error: 'Las fechas enviadas no son válidas.'
    };
  }

  if (startDate > endDate) {
    return {
      error: 'La fecha desde no puede ser mayor a la fecha hasta.'
    };
  }

  return {
    startDate,
    endDate,
    usedDefaultRange: false
  };
};

const buildDeliveredOrdersWhere = (startDate: Date, endDate: Date) => ({
  estado_actual: {
    nombre: {
      equals: DELIVERED_STATE_NAME,
      mode: 'insensitive' as const
    }
  },
  entrega_real: {
    gte: startDate,
    lte: endDate
  }
});

const calculateOrderTotal = (order: any) =>
  order.lineas.reduce((sum: number, line: any) => sum + Number(line.subtotal), 0);

const findDeliveredOrders = async (startDate: Date, endDate: Date) =>
  prisma.orden.findMany({
    where: buildDeliveredOrdersWhere(startDate, endDate),
    include: {
      lineas: {
        select: {
          subtotal: true
        }
      }
    }
  });

export const getTotalBilling = async (req: any, res: any) => {
  try {
    const dateRange = getDateRangeFromQuery(req.query);

    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }

    const orders = await findDeliveredOrders(dateRange.startDate, dateRange.endDate);
    const totalBilling = orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);

    res.json({
      total_facturacion: totalBilling,
      cantidad_ordenes: orders.length,
      fecha_desde: formatArgentinaDateTime(dateRange.startDate),
      fecha_hasta: formatArgentinaDateTime(dateRange.endDate),
      rango_por_defecto: dateRange.usedDefaultRange
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la facturación total' });
  }
};

export const getAverageTicket = async (req: any, res: any) => {
  try {
    const dateRange = getDateRangeFromQuery(req.query);

    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }

    const orders = await findDeliveredOrders(dateRange.startDate, dateRange.endDate);
    const totalBilling = orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);
    const averageTicket = orders.length > 0 ? totalBilling / orders.length : 0;

    res.json({
      ticket_promedio: averageTicket,
      total_facturacion: totalBilling,
      cantidad_ordenes: orders.length,
      fecha_desde: formatArgentinaDateTime(dateRange.startDate),
      fecha_hasta: formatArgentinaDateTime(dateRange.endDate),
      rango_por_defecto: dateRange.usedDefaultRange
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el ticket promedio' });
  }
};

export const getDeliveryTimeConcentration = async (req: any, res: any) => {
  try {
    const orders = await prisma.orden.findMany({
      where: {
        estado_actual: {
          es_final: false
        }
      },
      select: {
        id: true,
        entrega_estimada: true
      },
      orderBy: {
        entrega_estimada: 'asc'
      }
    });

    const concentrationByHour = Array.from({ length: 24 }, (_, hour) => ({
      hora: hour,
      cantidad_ordenes: 0
    }));

    orders.forEach((order) => {
      const hour = getArgentinaHour(order.entrega_estimada);
      concentrationByHour[hour].cantidad_ordenes += 1;
    });

    res.json({
      total_ordenes_no_finales: orders.length,
      concentracion_por_horario: concentrationByHour
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la concentración por horario de entrega' });
  }
};
