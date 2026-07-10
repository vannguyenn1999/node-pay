import express from 'express';
import { StatisticalController } from '~/controllers/statisticalController.js';
import { AuthMiddlewares } from '~/middlewares/auth';

const StatisticalRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];

StatisticalRouter.route('/')
  .get(...adminAuth, StatisticalController.getStatistics);

export default StatisticalRouter;
