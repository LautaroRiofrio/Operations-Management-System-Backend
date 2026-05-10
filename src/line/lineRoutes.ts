// src/routes/lineRoutes.ts
import { Router } from 'express';
import { 
  searchLinesByOrder, 
  getLineById,
  saveLine, 
  updateLine, 
  deleteLine 
} from './lineController';

const router = Router();

// Por orden
router.get('/order/:orderId', searchLinesByOrder);

// Crear
router.post('/', saveLine);

// Por ID (para actualizar/borrar)
router.get('/:id', getLineById);
router.put('/:id', updateLine);
router.delete('/:id', deleteLine);

export default router;
