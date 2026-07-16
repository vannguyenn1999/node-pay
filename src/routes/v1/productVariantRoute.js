import express from "express"

import { ProductVariantController } from '~/controllers/productVariantController.js';
import { uploadCloud } from '~/config/cloudinary.js';
import {AuthMiddlewares} from '~/middlewares/auth'

const ProductVariantRouter = express.Router()
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];

ProductVariantRouter.route('/')
.get(ProductVariantController.getAllProductVariant)
.post(uploadCloud.single('imageColor'), ...adminAuth, ProductVariantController.createProductVariant);

ProductVariantRouter.get('/detail/:sku' , ProductVariantController.getProductVariantDetail)

ProductVariantRouter.route('/:categorySlug/:serieSlug').get(ProductVariantController.getProductVariantBySerie)

// GET, PUT, DELETE specific category
ProductVariantRouter.route('/:productSlug')
  .get(ProductVariantController.getProductVariant)
  .put(uploadCloud.single('imageColor'), ...adminAuth, ProductVariantController.updateProductVariant)
  .delete(...adminAuth, ProductVariantController.deleteProductVariant);



export default ProductVariantRouter