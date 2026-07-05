import express from 'express';

import { PayController } from '~/controllers/payController.js';
import { AuthMiddlewares } from '~/middlewares/auth.js';

const PayRouter = express.Router();

// Apply auth middleware to all pay endpoints
PayRouter.use(AuthMiddlewares.checkAuthorization); 

PayRouter.route('/create-payment').post(PayController.createPayment);
PayRouter.route('/payos-webhook').post(PayController.handleWebhook);
PayRouter.route('/get-info/:orderCode').get(PayController.getPayment);

export default PayRouter;