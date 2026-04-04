// src/controllers/batchController.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchBatches = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const batches = await prisma.lote.findMany({
      skip: skip,
      take: pageSize,
      include: {
        detalle_compra: {
          include: {
            ingrediente: true,
            compra: {
              include: { proveedor: true } 
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const total = await prisma.lote.count();

    res.json({
      data: batches,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar lotes' });
  }
};

export const getBatchById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const batch = await prisma.lote.findUnique({
      where: { id: Number(id) },
      include: { detalle_compra: { include: { ingrediente: true } } }
    });

    if (!batch) return res.status(404).json({ error: 'Lote no encontrado' });
    
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar lote' });
  }
};

export const getBatchesByIngredient = async (req: any, res: any) => {
  try {
    const { ingredientId } = req.params;

    const detalles = await prisma.detalle_compra.findMany({
      where: { id_ingrediente: Number(ingredientId) },
      select: { id: true }
    });

    const idsDetalles = detalles.map(d => d.id);

    const batches = await prisma.lote.findMany({
      where: { id_detalle_compra: { in: idsDetalles } },
      include: { detalle_compra: { include: { ingrediente: true } } },
      orderBy: { id: 'asc' }
    });

    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lotes del ingrediente' });
  }
};

// 4. Obtener el lote más antiguo (PEPS - First In, First Out)
export const getOldestBatch = async (req: any, res: any) => {
  try {
    const { ingredientId } = req.params;

    const detalles = await prisma.detalle_compra.findMany({
      where: { id_ingrediente: Number(ingredientId) },
      select: { id: true }
    });

    if (detalles.length === 0) {
      return res.status(404).json({ error: 'No hay compras para este ingrediente' });
    }

    const oldestBatch = await prisma.lote.findFirst({
      where: { 
        id_detalle_compra: { in: detalles.map(d => d.id) },
        cantidad_restante: { gt: 0 }
      },
      orderBy: { id: 'asc' }, 
      include: { detalle_compra: true }
    });

    if (!oldestBatch) {
      return res.status(404).json({ error: 'No hay stock disponible en lotes antiguos' });
    }

    res.json(oldestBatch);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lote más antiguo' });
  }
};

export const saveBatch = async (req: any, res: any) => {
  try {
    const { id_detalle_compra, cantidad_restante } = req.body;

    const detalle = await prisma.detalle_compra.findUnique({
      where: { id: Number(id_detalle_compra) }
    });
    
    if (!detalle) return res.status(404).json({ error: 'Detalle de compra no encontrado' });

    const newBatch = await prisma.lote.create({
      data: {
        id_detalle_compra: Number(id_detalle_compra),
        cantidad_restante: Number(detalle.cantidad)
      },
      include: { detalle_compra: true }
    });

    res.status(201).json(newBatch);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear lote' });
  }
};

export const updateBatchQuantity = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { cantidad_restante } = req.body;

    const updatedBatch = await prisma.lote.update({
      where: { id: Number(id) },
      data: { cantidad_restante: Number(cantidad_restante) }
    });

    res.json(updatedBatch);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cantidad del lote' });
  }
};

export const consumeFromBatch = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { cantidad_a_consumir } = req.body;

    if (cantidad_a_consumir <= 0) {
      return res.status(400).json({ error: 'La cantidad a consumir debe ser mayor a 0' });
    }

    const batch = await prisma.lote.findUnique({
      where: { id: Number(id) }
    });

    if (!batch) return res.status(404).json({ error: 'Lote no encontrado' });

    if (batch.cantidad_restante < cantidad_a_consumir) {
      return res.status(400).json({ error: 'Stock insuficiente en este lote' });
    }

    const newQuantity = batch.cantidad_restante - cantidad_a_consumir;

    const updatedBatch = await prisma.lote.update({
      where: { id: Number(id) },
      data: { cantidad_restante: newQuantity }
    });

    res.json({ 
      message: 'Consumo registrado correctamente', 
      lote: updatedBatch 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al consumir del lote' });
  }
};


export const getBatchByPurchaseDetailId = async (req: any, res: any) => {
  try {
    console.log({"params": req.params});
    
    const { purchaseDetailId } = req.params;
    const idNum = Number(purchaseDetailId);

    const purchaseDetail = await prisma.detalle_compra.findUnique({
        where: { id: idNum }
    });
    
    if (!purchaseDetail) {
      return res.status(404).json({ error: "No existe el detalle de compra" });
    }

    const batch = await prisma.lote.findFirst({
      where: { 
        id_detalle_compra: idNum 
      },
      include: {
        detalle_compra: {
          select: {
            id: true,
            cantidad: true,
            ingrediente: { select: { id: true, nombre: true } }
          }
        }
      }
    });

    if (!batch) {
      return res.status(404).json({ error: "No existe un lote asociado a este detalle" });
    }

    res.json(batch);

  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};