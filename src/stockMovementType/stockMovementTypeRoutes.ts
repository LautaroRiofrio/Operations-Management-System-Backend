import { Router } from 'express';
import {
  searchStockMovementTypes,
  getStockMovementTypeById,
  saveStockMovementType,
  updateStockMovementType,
  deleteStockMovementType
} from './stockMovementTypeController';

const router = Router();

router.get('/', searchStockMovementTypes);
router.post('/', saveStockMovementType);
router.get('/:id', getStockMovementTypeById);
router.put('/:id', updateStockMovementType);
router.delete('/:id', deleteStockMovementType);

export default router;
