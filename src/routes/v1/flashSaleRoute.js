import express from 'express';
import { FlashSaleController } from '~/controllers/flashSaleController.js';
import { AuthMiddlewares } from '~/middlewares/auth.js';
import { VALIDATIONS } from '~/validations/Validation.js';

const FlashSaleRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];

// Admin Routes
FlashSaleRouter.route('/events')
  .post(...adminAuth, VALIDATIONS.createFlashSaleEvent, FlashSaleController.createEvent)
  .get(...adminAuth, FlashSaleController.getAdminEvents);

FlashSaleRouter.route('/events/:eventId/items')
  .post(...adminAuth, VALIDATIONS.addFlashSaleItem, FlashSaleController.addFlashSaleItem)
  .get(...adminAuth, FlashSaleController.getAdminEventItems);

FlashSaleRouter.route('/events/:id')
  .delete(...adminAuth, FlashSaleController.deleteEvent);

// Public / User Routes
FlashSaleRouter.route('/active')
  .get(FlashSaleController.getActiveFlashSales);

FlashSaleRouter.route('/items/:itemId')
  .get(FlashSaleController.getFlashSaleItemDetails);

export default FlashSaleRouter;
