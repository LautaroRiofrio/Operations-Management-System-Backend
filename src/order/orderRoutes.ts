// src/routes/orderRoutes.ts
import { Router } from 'express';
import { 
  searchOrders, 
  getOrderById, 
  getOrdersByClient, 
  saveOrder, 
  updateOrder, 
  deleteOrder 
} from './orderController';

const router = Router();

router.get('/', searchOrders);
router.post('/', saveOrder);

router.get('/client/:clientId', getOrdersByClient);

router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;