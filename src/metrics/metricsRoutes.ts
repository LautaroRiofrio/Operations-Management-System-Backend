import { Router } from 'express';
import {
  getAverageTimeByState,
  getAverageTicket,
  getCostAndProfit,
  getDeliveryTimeConcentration,
  getDeliveredOrdersStateDetails,
  getTopSellingProducts,
  getTotalBilling
} from './metricsController';

const router = Router();

router.get('/total-billing', getTotalBilling);
router.get('/average-ticket', getAverageTicket);
router.get('/cost-and-profit', getCostAndProfit);
router.get('/top-selling-products', getTopSellingProducts);
router.get('/average-time-by-state', getAverageTimeByState);
router.get('/state-details/:stateId', getDeliveredOrdersStateDetails);
router.get('/delivery-time-concentration', getDeliveryTimeConcentration);

export default router;
