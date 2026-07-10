import express from 'express';
import { UserController } from '~/controllers/userController.js';
import { AuthMiddlewares } from '~/middlewares/auth';

const UserRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];

UserRouter.route('/')
  .get(...adminAuth, UserController.getAllUsers);

UserRouter.route('/:id')
  .put(...adminAuth, UserController.updateUser)
  .delete(...adminAuth, UserController.deleteUser);

export default UserRouter;
