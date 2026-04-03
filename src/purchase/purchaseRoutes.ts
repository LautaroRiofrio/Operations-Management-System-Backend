// src/routes/shoppingRoutes.ts
import { Router } from 'express';
import {
    searchPurchase, savePurchase, getPurchaseById, getPurchaseProvider } from './shoppingController';

const router = Router();

router.get('/', searchPurchase);
router.post('/', savePurchase);
router.get('/:id', getPurchaseById);
router.get('/provider/:providerId', getPurchaseProvider);

export default router;