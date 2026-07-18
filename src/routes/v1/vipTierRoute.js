import express from 'express';
import { VipTierController } from '~/controllers/vipTierController.js';
import { AuthMiddlewares } from '~/middlewares/auth';

const VipTierRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];
const userAuth = [AuthMiddlewares.checkAuthorization];

VipTierRouter.route('/')
  .get(...userAuth, VipTierController.getAllVipTiers)
  .post(...adminAuth, VipTierController.createVipTier);

VipTierRouter.route('/:id')
  .put(...adminAuth, VipTierController.updateVipTier)
  .delete(...adminAuth, VipTierController.deleteVipTier);

export default VipTierRouter;
