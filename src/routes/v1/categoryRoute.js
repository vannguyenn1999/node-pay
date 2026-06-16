import express from 'express';

import { CategoryController } from '~/controllers/categoryController.js';

const CategoryRouter = express.Router();

CategoryRouter.route('/')
  .get(CategoryController.getAllCategories)
  .post(CategoryController.createCategory);

// GET, PUT, DELETE specific category
CategoryRouter.route('/:id')
  .get(CategoryController.getCategoryById)
  .put(CategoryController.updateCategory)
  .delete(CategoryController.deleteCategory);

export default CategoryRouter;
