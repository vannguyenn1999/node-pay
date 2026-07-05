import express from 'express';

import { CartController } from '~/controllers/cartController.js';
import { AuthMiddlewares } from '~/middlewares/auth.js';

const CartRouter = express.Router();

// Apply auth middleware to all cart endpoints
CartRouter.use(AuthMiddlewares.checkAuthorization);

CartRouter.route('/')
  .get(CartController.getCart)
  .put(CartController.updateCart);

export default CartRouter;
