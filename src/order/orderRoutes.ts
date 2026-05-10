// src/routes/orderRoutes.ts
import { Router } from 'express';
import { 
  searchOrders, 
  getOrderById, 
  getOrderHistory,
  getOrdersByClient, 
  saveOrder, 
  updateOrder, 
  deleteOrder, 
  searchOrdersByState
} from './orderController';

const router = Router();

router.get('/', searchOrders);
router.post('/', saveOrder);

router.get('/client/:clientId', getOrdersByClient);
router.get('/state/:state', searchOrdersByState);
router.get('/:id/history', getOrderHistory);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
