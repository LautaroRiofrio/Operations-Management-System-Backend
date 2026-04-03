// src/routes/ingredientRoutes.ts
import { Router } from 'express';
import { 
  searchIngredients, 
  getIngredientById, 
  saveIngredient, 
  updateIngredient, 
  deleteIngredient 
} from './ingredientController';

const router = Router();

router.get('/', searchIngredients);
router.post('/', saveIngredient);
router.get('/:id', getIngredientById);
router.put('/:id', updateIngredient);
router.delete('/:id', deleteIngredient);

export default router;