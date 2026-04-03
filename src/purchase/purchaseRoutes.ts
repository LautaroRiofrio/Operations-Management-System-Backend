// src/routes/shoppingRoutes.ts
import { Router } from 'express';
import {
    searchPurchase, savePurchase, getPurchaseById, getPurchaseProvider } from './purchaseController';

const router = Router();

router.get('/', searchPurchase);
router.post('/', savePurchase);
router.get('/:id', getPurchaseById);
router.get('/provider/:providerId', getPurchaseProvider);

export default router;