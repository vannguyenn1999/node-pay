import express from 'express';
import { VoucherController } from '~/controllers/voucherController.js';
import { AuthMiddlewares } from '~/middlewares/auth.js';
import { VALIDATIONS } from '~/validations/Validation.js';

const VoucherRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];
const userAuth = [AuthMiddlewares.checkAuthorization];

// Admin Routes
VoucherRouter.route('/')
  .post(...adminAuth, VALIDATIONS.createVoucher, VoucherController.createVoucher);

VoucherRouter.route('/admin')
  .get(...adminAuth, VoucherController.getAdminVouchers);

VoucherRouter.route('/:id/status')
  .patch(...adminAuth, VALIDATIONS.updateVoucherStatus, VoucherController.updateVoucherStatus);

VoucherRouter.route('/:id/limits')
  .patch(...adminAuth, VALIDATIONS.updateVoucherLimits, VoucherController.updateVoucherLimits);

VoucherRouter.route('/:id')
  .delete(...adminAuth, VoucherController.deleteVoucher);

VoucherRouter.route('/usages')
  .get(...adminAuth, VoucherController.getVoucherUsages);

VoucherRouter.route('/usages/:usageId/void')
  .post(...adminAuth, VALIDATIONS.voidUsage, VoucherController.voidUsage);

// User/Public Routes
VoucherRouter.route('/active')
  .get(...userAuth, VoucherController.getActiveVouchers);

VoucherRouter.route('/apply')
  .post(...userAuth, VALIDATIONS.applyVoucher, VoucherController.applyVoucher);

export default VoucherRouter;
