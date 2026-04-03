// src/routes/shoppingRoutes.ts
import { Router } from 'express';
import {
    searchShoppings, saveShopping, getShoppingById, getShoppingProvider } from './shoppingController';

const router = Router();

router.get('/', searchShoppings);
router.post('/', saveShopping);
router.get('/:id', getShoppingById);
router.get('/provider/:providerId', getShoppingProvider);

export default router;