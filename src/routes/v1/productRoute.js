import express from "express"

import { ProductController } from '~/controllers/productController';
import {AuthMiddlewares} from '~/middlewares/auth'
import { uploadCloud } from '~/config/cloudinary.js';

const ProductRouter = express.Router()
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];

ProductRouter.route('/')
  .get(ProductController.getAllProducts)
  .post(uploadCloud.fields([
      { name: 'images', maxCount: 10 },
      { name: 'mainImage', maxCount: 1 }]), ...adminAuth, ProductController.createProduct);

// GET, PUT, DELETE specific category
ProductRouter.route('/:id')
  .get(ProductController.getProductById)
  .put(uploadCloud.fields([
      { name: 'images', maxCount: 10 },
      { name: 'mainImage', maxCount: 1 }]), ...adminAuth,  ProductController.updateProduct)
  .delete(ProductController.deleteProduct);

export default ProductRouter