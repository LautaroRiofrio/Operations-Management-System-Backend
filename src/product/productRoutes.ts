import { Router } from 'express';
import {
    searchProducts,
    getProductById,
    getProductsByCategory,
    saveProduct,
    updateProduct,
    deleteProduct
} from './productController';

const router = Router();

router.get('/', searchProducts);
router.get('/:id', getProductById);
router.get('/category/:categoryId', getProductsByCategory);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/', saveProduct);

export default router;