import { Router } from 'express';
import { 
  searchCategories, 
  getCategoryById, 
  saveCategory, 
  updateCategory, 
  deleteCategory 
} from './categoryController';

const router = Router();

router.get('/', searchCategories);
router.post('/', saveCategory);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;