// src/routes/clientRoutes.ts
import { Router } from 'express';
import { searchClients, createClient, getClientById } from './clientController';

const router = Router();

router.get('/', searchClients);      
router.post('/', createClient);
router.get('/:id', getClientById);

export default router;