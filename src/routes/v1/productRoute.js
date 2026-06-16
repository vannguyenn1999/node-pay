import express from "express"

import { ProductController } from '~/controllers/productController';
import { uploadCloud } from '~/config/cloudinary.js';

const ProductRouter = express.Router()

ProductRouter.route('/')
  .get(ProductController.getAllProducts)
  .post(uploadCloud.single('mainImage') , ProductController.createProduct);

// GET, PUT, DELETE specific category
ProductRouter.route('/:id')
  .get(ProductController.getProductById)
  .put(uploadCloud.single('mainImage'), ProductController.updateProduct)
  .delete(ProductController.deleteProduct);

export default ProductRouter