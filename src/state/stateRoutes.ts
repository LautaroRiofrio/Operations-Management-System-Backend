import { Router } from 'express';
import {
  searchStates,
  getStateById,
  saveState,
  updateState,
  deleteState
} from './stateController';

const router = Router();

router.get('/', searchStates);
router.post('/', saveState);
router.get('/:id', getStateById);
router.put('/:id', updateState);
router.delete('/:id', deleteState);

export default router;
