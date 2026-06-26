import express from "express"

import { ProductVariantController } from '~/controllers/productVariantController.js';
import { uploadCloud } from '~/config/cloudinary.js';

const ProductVariantRouter = express.Router()

ProductVariantRouter.route('/')
.get(ProductVariantController.getAllProductVariant)
.post(uploadCloud.single('imageColor'), ProductVariantController.createProductVariant);

ProductVariantRouter.get('/detail/:sku' , ProductVariantController.getProductVariantDetail)

ProductVariantRouter.route('/:categorySlug/:serieSlug').get(ProductVariantController.getProductVariantBySerie)

// GET, PUT, DELETE specific category
ProductVariantRouter.route('/:productSlug')
  .get(ProductVariantController.getProductVariant)
  .put(uploadCloud.single('imageColor'), ProductVariantController.updateProductVariant)
  .delete(ProductVariantController.deleteProductVariant);



export default ProductVariantRouter