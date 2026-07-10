import express from 'express';

import { PayController } from '~/controllers/payController.js';
import { AuthMiddlewares } from '~/middlewares/auth.js';

const PayRouter = express.Router();
 
PayRouter.route('/create-payment').post(AuthMiddlewares.checkAuthorization , PayController.createPayment);
PayRouter.route('/get-info/:orderCode').get(AuthMiddlewares.checkAuthorization , PayController.getPayment);
PayRouter.route('/get-history').get(AuthMiddlewares.checkAuthorization , PayController.getPaymentHistory);
PayRouter.route('/get-history/:orderCode').get(AuthMiddlewares.checkAuthorization , PayController.getPaymentHistoryDetail);

PayRouter.route('/get-pay').get(AuthMiddlewares.checkAuthorization , AuthMiddlewares.checkAdmin , PayController.getPaymentAdmin);

PayRouter.route('/payos-webhook').post(PayController.handleWebhook); 
PayRouter.route('/cancel-payment').get(PayController.handlePaymentFailure);
export default PayRouter;