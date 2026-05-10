import { Router } from 'express';
import {
  searchStockMovements,
  getStockMovementById,
  saveStockMovement,
  updateStockMovement,
  deleteStockMovement
} from './stockMovementController';

const router = Router();

router.get('/', searchStockMovements);
router.post('/', saveStockMovement);
router.get('/:id', getStockMovementById);
router.put('/:id', updateStockMovement);
router.delete('/:id', deleteStockMovement);

export default router;
