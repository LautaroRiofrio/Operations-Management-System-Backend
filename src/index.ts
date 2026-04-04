// src/index.ts
import express, { Request, Response } from 'express';
import clientRoutes from './client/clientRoutes'; 
import providerRoutes from './provider/providerRoutes';
import purchaseRoutes from './purchase/purchaseRoutes'
import ingredientRoutes from './ingredient/ingredientRoutes'
import purchaseDetailRouter from './purchaseDetail/purchaseDetailRoutes'
import batchRoutes from './batch/batchRoutes'
import productRoutes from './product/productRoutes'
import categoryRoutes from './category/categoryRoutes'
import recipeRoutes from './recipe/recipeRoutes'
import orderRoutes from './order/orderRoutes'
import lineRoutes from './line/lineRoutes'

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
app.use('/api/purchaseDetail', purchaseDetailRouter);
app.use('/api/batch', batchRoutes);
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes)
app.use('/api/recipe', recipeRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/line', lineRoutes)
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});