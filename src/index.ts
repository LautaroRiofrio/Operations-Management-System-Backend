// src/index.ts
import express, { Request, Response } from 'express';
import clientRoutes from './client/clientRoutes'; 
import providerRoutes from './provider/providerRoutes';
import purchaseRoutes from './purchase/purchaseRoutes'
import ingredientRoutes from './ingredient/ingredientRoutes'
const app = express();
const PORT = 3000;

// Middleware para que el servidor entienda JSON
app.use(express.json());

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.send('API funcionando 🚀');
});

// Rutas de la API
app.use('/api/clients', clientRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/ingredient', ingredientRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});