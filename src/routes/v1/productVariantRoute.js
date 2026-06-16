import express from "express"

import { ProductVariantController } from '~/controllers/productVariantController.js';
import { uploadCloud } from '~/config/cloudinary.js';

const ProductVariantRouter = express.Router()

ProductVariantRouter.route('/')
.post(uploadCloud.array('images', 10), ProductVariantController.createProductVariant);

// GET, PUT, DELETE specific category
ProductVariantRouter.route('/:productSlug')
  .get(ProductVariantController.getProductVariantDetail)
  .put(uploadCloud.array('images', 10), ProductVariantController.updateProductVariant)
  .delete(ProductVariantController.deleteProductVariant);

export default ProductVariantRouter