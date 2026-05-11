// src/index.ts
import './config/timezone';
import express, { Request, Response } from 'express';
import clientRoutes from './client/clientRoutes'; 
import ingredientRoutes from './ingredient/ingredientRoutes'
import productRoutes from './product/productRoutes'
import categoryRoutes from './category/categoryRoutes'
import recipeRoutes from './recipe/recipeRoutes'
import orderRoutes from './order/orderRoutes'
import lineRoutes from './line/lineRoutes'
import stateRoutes from './state/stateRoutes'
import stockMovementTypeRoutes from './stockMovementType/stockMovementTypeRoutes'
import stockMovementRoutes from './stockMovement/stockMovementRoutes'
import metricsRoutes from './metrics/metricsRoutes'

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
app.use('/api/ingredient', ingredientRoutes);
app.use('/api/product', productRoutes);
app.use('/api/category', categoryRoutes)
app.use('/api/recipe', recipeRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/line', lineRoutes)
app.use('/api/state', stateRoutes)
app.use('/api/stockMovementType', stockMovementTypeRoutes)
app.use('/api/stockMovement', stockMovementRoutes)
app.use('/api/metrics', metricsRoutes)
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
