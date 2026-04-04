// src/routes/batchRoutes.ts
import { Router } from 'express';
import { 
  searchBatches, 
  getBatchById, 
  getBatchesByIngredient, 
  getOldestBatch, 
  saveBatch, 
  updateBatchQuantity,
  consumeFromBatch,
  getBatchByPurchaseDetailId
} from './batchController';

const router = Router();

router.get('/', searchBatches);
router.post('/', saveBatch);
router.get('/purchaseDetail/:purchaseDetailId', getBatchByPurchaseDetailId);
router.get('/oldest/:ingredientId', getOldestBatch); 
router.get('/ingredient/:ingredientId', getBatchesByIngredient);
router.get('/:id', getBatchById);
router.put('/:id', updateBatchQuantity);
router.patch('/:id/consume', consumeFromBatch);


export default router;