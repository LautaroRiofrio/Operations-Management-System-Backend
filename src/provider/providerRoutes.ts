import { Router } from "express";
import { createProvider, searchProviders, getProviderById } from "./providerController";

const router = Router();

router.get('/', searchProviders);
router.post('/', createProvider);
router.get('/:id', getProviderById);

export default router;