import { Router } from 'express';
import { 
  searchRecipes, 
  getRecipeById, 
  getRecipeByProductId, 
  getRecipeIngredients, 
  saveRecipe, 
  updateRecipe, 
  deleteRecipe 
} from './recipeController';

const router = Router();

router.get('/', searchRecipes);
router.post('/', saveRecipe);

router.get('/product/:productId', getRecipeByProductId); 
router.get('/ingredients/:id', getRecipeIngredients); 

router.get('/:id', getRecipeById);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;