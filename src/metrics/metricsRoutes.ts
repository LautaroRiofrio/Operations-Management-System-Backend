import { Router } from 'express';
import {
  getAverageTicket,
  getDeliveryTimeConcentration,
  getTotalBilling
} from './metricsController';

const router = Router();

router.get('/total-billing', getTotalBilling);
router.get('/average-ticket', getAverageTicket);
router.get('/delivery-time-concentration', getDeliveryTimeConcentration);

export default router;
