import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const searchProviders = async (req: any, res: any) => {
    try{
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;

        const skip = (page - 1) * pageSize;

        const providers = await prisma.proveedor.findMany({
            skip: skip,
            take: pageSize,
        });

        const total = await prisma.proveedor.count();

        res.json({
            data: providers,
            meta: {
                total: total,
                page: page,
                pageSize: pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener proveedores"});
    }
}

export const createProvider = async (req: any, res: any) => {
    try {
        const {nombre} = req.body;
        const newProvider = await prisma.proveedor.create({
            data: {nombre}
        });
        res.status(201).json(newProvider);
    } catch (error) {
        res.status(500).json({ error: "Error al crear proveedor"})
    }
}

export const getProviderById = async (req: any, res: any) => {
    try {
        const {id} = req.params;
        const provider = await prisma.proveedor.findUnique({
            where: { 
                id : Number(id)
            }
        });
        if (!provider){
            return res.status(404).json({ error: "Proveedor no encontrado"});
        }
        res.json(provider);
    } catch (error){
        res.status(500).json({ error: "Error al buscar proveedor"});
    }
}