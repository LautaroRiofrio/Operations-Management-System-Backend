import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const searchPurchasesDetails = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const details = await prisma.detalle_compra.findMany({
      skip: skip,
      take: pageSize,
      include: {
        compra: { include: { proveedor: true } }, 
        ingrediente: true                         
      },
      orderBy: { id: 'desc' }
    });

    const total = await prisma.detalle_compra.count();

    res.json({
      data: details,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar detalles de compra' });
  }
};


export const getPurchaseDetailById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const detail = await prisma.detalle_compra.findUnique({
      where: { id: Number(id) },
      include: {
        compra: true,
        ingrediente: true
      }
    });

    if (!detail) {
      return res.status(404).json({ error: 'Detalle de compra no encontrado' });
    }

    res.json(detail);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar detalle de compra' });
  }
};


export const getPurchasesDetailsByPurchaseId = async (req: any, res: any) => {
  try {
    const { purchaseId } = req.params;

    const details = await prisma.detalle_compra.findMany({
      where: { id_compra: Number(purchaseId) },
      include: {
        ingrediente: true
      },
      orderBy: { id: 'asc' }
    });

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalles de la compra' });
  }
};


export const getPurchasesDetailsByIngredientId = async (req: any, res: any) => {
  try {
    const { ingredientId } = req.params;

    const details = await prisma.detalle_compra.findMany({
      where: { id_ingrediente: Number(ingredientId) },
      include: {
        compra: { include: { proveedor: true } } 
      },
      orderBy: { id: 'desc' }
    });

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial del ingrediente' });
  }
};


export const savePurchaseDetail = async (req: any, res: any) => {
  try {
    const { id_compra, id_ingrediente, cantidad, precio_unitario } = req.body;

    if (!id_compra || !id_ingrediente || cantidad === undefined || precio_unitario === undefined) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const subtotal = Number(cantidad) * Number(precio_unitario);

    const newDetail = await prisma.detalle_compra.create({
      data: {
        id_compra: Number(id_compra),
        id_ingrediente: Number(id_ingrediente),
        cantidad: Number(cantidad),
        precio_unitario: Number(precio_unitario),
        subtotal: subtotal
      },
      include: {
        ingrediente: true,
        compra: true
      }
    });

    res.status(201).json(newDetail);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear detalle de compra' });
  }
};