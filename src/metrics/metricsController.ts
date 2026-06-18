import { PrismaClient } from '@prisma/client';
import {
  formatArgentinaDateTime,
  getArgentinaDayBounds,
  getArgentinaHour,
  getArgentinaMonthRange,
  parseArgentinaDateTime
} from '../utils/argentinaDateTime';

const prisma = new PrismaClient();

const DELIVERED_STATE_NAME = 'entregado';
const CANCELED_STATE_NAME = 'cancelado';
const MILLISECONDS_PER_MINUTE = 60 * 1000;

const formatDuration = (durationInMs: number) => {
  const totalSeconds = Math.floor(durationInMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
};

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

const buildFinalizedOrdersWhere = (startDate: Date, endDate: Date) => ({
  estado_actual: {
    nombre: {
      in: [DELIVERED_STATE_NAME, CANCELED_STATE_NAME]
    }
  },
  entrega_real: {
    gte: startDate,
    lte: endDate
  }
});

const getDateTimeRangeFromQuery = (query: any) => {
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
    startDate = parseArgentinaDateTime(startDateRaw);
    endDate = parseArgentinaDateTime(endDateRaw);
  } catch (error) {
    return {
      error: 'Las fechas enviadas no son validas.'
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

export const getTopSellingProducts = async (req: any, res: any) => {
  try {
    const dateRange = getDateRangeFromQuery(req.query);

    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }

    const [soldProducts, allProducts] = await Promise.all([
      prisma.linea.groupBy({
        by: ['id_producto'],
        where: {
          orden: buildDeliveredOrdersWhere(dateRange.startDate, dateRange.endDate)
        },
        _sum: {
          cantidad: true
        }
      }),
      prisma.producto.findMany({
        select: {
          id: true,
          nombre: true,
          precio: true,
          id_categoria: true
        },
        orderBy: {
          nombre: 'asc'
        }
      })
    ]);

    const soldProductsMap = new Map(
      soldProducts.map((product) => [
        product.id_producto,
        Number(product._sum.cantidad ?? 0)
      ])
    );

    const productos = allProducts
      .map((product) => ({
        id_producto: product.id,
        nombre: product.nombre,
        precio: product.precio,
        id_categoria: product.id_categoria,
        cantidad_vendida: Number((soldProductsMap.get(product.id) ?? 0).toFixed(2))
      }))
      .sort((a, b) => {
        if (b.cantidad_vendida !== a.cantidad_vendida) {
          return b.cantidad_vendida - a.cantidad_vendida;
        }

        return a.nombre.localeCompare(b.nombre);
      });

    res.json({
      fecha_desde: formatArgentinaDateTime(dateRange.startDate),
      fecha_hasta: formatArgentinaDateTime(dateRange.endDate),
      rango_por_defecto: dateRange.usedDefaultRange,
      cantidad_productos: productos.length,
      cantidad_productos_vendidos: productos.filter((product) => product.cantidad_vendida > 0).length,
      productos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la metrica de productos mas vendidos' });
  }
};

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

export const getCostAndProfit = async (req: any, res: any) => {
  try {
    const dateRange = getDateRangeFromQuery(req.query);

    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }

    const orders = await prisma.orden.findMany({
      where: buildFinalizedOrdersWhere(dateRange.startDate, dateRange.endDate),
      include: {
        lineas: {
          select: {
            cantidad: true,
            producto: {
              select: {
                preparacion: {
                  select: {
                    ingredientes: {
                      select: {
                        cantidad: true,
                        ingrediente: {
                          select: {
                            costo: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        movimientos_stock: {
          select: {
            detalles: {
              where: {
                id_producto: {
                  not: null
                }
              },
              select: {
                subtotal: true
              }
            }
          }
        }
      }
    });

    const totalCost = orders.reduce((orderSum, order) => (
      orderSum + order.lineas.reduce((lineSum, line) => {
        const lineQuantity = Number(line.cantidad);
        const recipeIngredients = line.producto.preparacion?.ingredientes ?? [];

        const lineCost = recipeIngredients.reduce((ingredientSum, recipeIngredient) => {
          const unitCost = Number(recipeIngredient.ingrediente.costo);
          return ingredientSum + (lineQuantity * Number(recipeIngredient.cantidad) * unitCost);
        }, 0);

        return lineSum + lineCost;
      }, 0)
    ), 0);

    const totalBilling = orders.reduce((orderSum, order) => (
      orderSum + order.movimientos_stock.reduce((movementSum, movement) => (
        movementSum + movement.detalles.reduce(
          (detailSum, detail) => detailSum + Number(detail.subtotal),
          0
        )
      ), 0)
    ), 0);

    res.json({
      costo: Number(totalCost.toFixed(2)),
      facturacion: Number(totalBilling.toFixed(2)),
      ganancia: Number((totalBilling - totalCost).toFixed(2)),
      cantidad_ordenes: orders.length,
      fecha_desde: formatArgentinaDateTime(dateRange.startDate),
      fecha_hasta: formatArgentinaDateTime(dateRange.endDate),
      rango_por_defecto: dateRange.usedDefaultRange
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la metrica de costos y ganancias' });
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

export const getAverageTimeByState = async (req: any, res: any) => {
  try {
    const dateRange = getDateTimeRangeFromQuery(req.query);

    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }

    const orders = await prisma.orden.findMany({
      where: buildDeliveredOrdersWhere(dateRange.startDate, dateRange.endDate),
      select: {
        id: true
      }
    });

    if (orders.length === 0) {
      return res.json({
        cantidad_ordenes: 0,
        fecha_desde: formatArgentinaDateTime(dateRange.startDate),
        fecha_hasta: formatArgentinaDateTime(dateRange.endDate),
        rango_por_defecto: dateRange.usedDefaultRange,
        promedios_por_estado: []
      });
    }

    const histories = await prisma.historial_Estado_Orden.findMany({
      where: {
        id_orden: {
          in: orders.map((order) => order.id)
        },
        estado: {
          es_final: false
        }
      },
      include: {
        estado: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { id_orden: 'asc' },
        { inicio: 'asc' },
        { id: 'asc' }
      ]
    });

    const groupedHistories = new Map<number, typeof histories>();

    histories.forEach((history) => {
      const orderHistories = groupedHistories.get(history.id_orden) ?? [];
      orderHistories.push(history);
      groupedHistories.set(history.id_orden, orderHistories);
    });

    const stateDurations = new Map<number, {
      id_estado: number;
      estado: string;
      total_duration_ms: number;
      cantidad_registros: number;
    }>();

    groupedHistories.forEach((orderHistories) => {
      orderHistories.forEach((history, index) => {
        const nextHistory = orderHistories[index + 1];
        const endDate = history.fin ?? nextHistory?.inicio;

        if (!endDate) {
          return;
        }

        const durationInMs = endDate.getTime() - history.inicio.getTime();

        if (durationInMs < 0) {
          return;
        }

        const currentStateDuration = stateDurations.get(history.estado.id) ?? {
          id_estado: history.estado.id,
          estado: history.estado.nombre,
          total_duration_ms: 0,
          cantidad_registros: 0
        };

        currentStateDuration.total_duration_ms += durationInMs;
        currentStateDuration.cantidad_registros += 1;

        stateDurations.set(history.estado.id, currentStateDuration);
      });
    });

    const promediosPorEstado = Array.from(stateDurations.values())
      .sort((a, b) => a.id_estado - b.id_estado)
      .map((stateDuration) => {
        const promedioEnMs = stateDuration.total_duration_ms / stateDuration.cantidad_registros;

        return {
          id_estado: stateDuration.id_estado,
          estado: stateDuration.estado,
          promedio_minutos: Number((promedioEnMs / MILLISECONDS_PER_MINUTE).toFixed(2)),
          promedio_formateado: formatDuration(promedioEnMs),
          cantidad_registros: stateDuration.cantidad_registros
        };
      });

    res.json({
      cantidad_ordenes: orders.length,
      fecha_desde: formatArgentinaDateTime(dateRange.startDate),
      fecha_hasta: formatArgentinaDateTime(dateRange.endDate),
      rango_por_defecto: dateRange.usedDefaultRange,
      promedios_por_estado: promediosPorEstado
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el tiempo promedio por estado' });
  }
};

export const getDeliveredOrdersStateDetails = async (req: any, res: any) => {
  try {
    const { stateId } = req.params;
    const parsedStateId = Number(stateId);

    if (!Number.isInteger(parsedStateId) || parsedStateId <= 0) {
      return res.status(400).json({ error: 'El estado indicado no es valido.' });
    }

    const dateRange = getDateTimeRangeFromQuery(req.query);

    if (dateRange.error) {
      return res.status(400).json({ error: dateRange.error });
    }

    const state = await prisma.estado.findUnique({
      where: { id: parsedStateId },
      select: {
        id: true,
        nombre: true,
        es_final: true
      }
    });

    if (!state) {
      return res.status(404).json({ error: 'El estado indicado no existe.' });
    }

    const orders = await prisma.orden.findMany({
      where: buildDeliveredOrdersWhere(dateRange.startDate, dateRange.endDate),
      include: {
        historial_estados: {
          include: {
            estado: {
              select: {
                id: true,
                nombre: true
              }
            }
          },
          orderBy: [
            { inicio: 'asc' },
            { id: 'asc' }
          ]
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    const ordersWithMatchingState = orders.filter((order) =>
      order.historial_estados.some((history) => history.id_estado === parsedStateId)
    );

    const detalles = ordersWithMatchingState.flatMap((order) =>
      order.historial_estados
        .filter((history) => history.id_estado === parsedStateId)
        .map((history) => {
          const currentIndex = order.historial_estados.findIndex((item) => item.id === history.id);
          const nextHistory = currentIndex >= 0
            ? order.historial_estados[currentIndex + 1]
            : undefined;

        let endDate = history.fin;

        if (!endDate) {
          endDate = nextHistory?.inicio ?? null;
        }

        const durationInMs = endDate
          ? endDate.getTime() - history.inicio.getTime()
          : null;

          const safeDurationInMs = durationInMs !== null && durationInMs >= 0
            ? durationInMs
            : null;

        return {
          orden_id: order.id,
          inicio: formatArgentinaDateTime(history.inicio),
          fin: formatArgentinaDateTime(endDate),
          tiempo: safeDurationInMs !== null
            ? Number((safeDurationInMs / MILLISECONDS_PER_MINUTE).toFixed(2))
            : null,
          tiempo_formateado: safeDurationInMs !== null
            ? formatDuration(safeDurationInMs)
            : null
        };
        })
    );

    res.json(detalles);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el detalle de órdenes por estado' });
  }
};
