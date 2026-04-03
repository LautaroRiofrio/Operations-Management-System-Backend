// src/controllers/clientController.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchClients = async (req: any, res: any) => {
  try {
    
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;    

    const clients = await prisma.cliente.findMany({
      skip: skip,      // Cuantos saltarse
      take: pageSize,  // Cuantos tomar
    });

    const total = await prisma.cliente.count();

    res.json({
      data: clients,
      meta: {
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createClient = async (req: any, res: any) => {
  try {
    const { nombre, whatsapp } = req.body;
    const newClient = await prisma.cliente.create({
      data: { nombre, whatsapp }
    });
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

export const getClientById = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: Number(id)
      }
    });
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(cliente);

  } catch (err) {
    res.status(500).json({ error: "Error al buscar cliente" });
  }
}


