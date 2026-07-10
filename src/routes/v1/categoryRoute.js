import express from 'express';

import { CategoryController } from '~/controllers/categoryController.js';
import {AuthMiddlewares} from '~/middlewares/auth'

const CategoryRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];

CategoryRouter.route('/')
  .get(CategoryController.getAllCategories)
  .post(...adminAuth , CategoryController.createCategory);

// GET, PUT, DELETE specific category
CategoryRouter.route('/:id')
  .get(CategoryController.getCategoryById)
  .put(...adminAuth, CategoryController.updateCategory)
  .delete(...adminAuth, CategoryController.deleteCategory);

export default CategoryRouter;
