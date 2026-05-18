import { Router } from 'express';
import {
  getAverageTimeByState,
  getAverageTicket,
  getDeliveryTimeConcentration,
  getDeliveredOrdersStateDetails,
  getTotalBilling
} from './metricsController';

const router = Router();

router.get('/total-billing', getTotalBilling);
router.get('/average-ticket', getAverageTicket);
router.get('/average-time-by-state', getAverageTimeByState);
router.get('/state-details/:stateId', getDeliveredOrdersStateDetails);
router.get('/delivery-time-concentration', getDeliveryTimeConcentration);

export default router;
