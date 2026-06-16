import express from 'express';

import AuthRouter from '~/routes/v1/authRoute.js';
import CategoryRouter from '~/routes/v1/categoryRoute.js';
import ProductRouter from '~/routes/v1/productRoute.js';
import SerieController from '~/routes/v1/serieRoute.js';
import ProductVariantRouter from '~/routes/v1/productVariantRoute.js';

const Router = express.Router();

Router.use('/auth', AuthRouter); 
Router.use('/categories', CategoryRouter);
Router.use('/products', ProductRouter);
Router.use('/series', SerieController);
Router.use('/product-variants', ProductVariantRouter);

export default Router;
