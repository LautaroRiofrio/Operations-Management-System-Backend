// src/routes/purchaseDetailRoutes.ts
import { Router } from 'express';
import {
    searchPurchasesDetails,
    getPurchaseDetailById,
    getPurchasesDetailsByPurchaseId,
    getPurchasesDetailsByIngredientId,
    savePurchaseDetail
} from './purchaseDetailController';

const router = Router();

router.get('/', searchPurchasesDetails);
router.post('/', savePurchaseDetail);
router.get('/:id', getPurchaseDetailById);
router.get('/purchase/:purchaseId', getPurchasesDetailsByPurchaseId);
router.get('/ingredient/:ingredientId', getPurchasesDetailsByIngredientId);

export default router;