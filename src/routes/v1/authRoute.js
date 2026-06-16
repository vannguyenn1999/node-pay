import express from 'express';

import { VALIDATIONS } from '~/validations/Validation';
import { AuthController } from '~/controllers/authController';

import { uploadCloud } from '~/config/cloudinary.js';
import {AuthMiddlewares} from '~/middlewares/auth'
const UserRouter = express.Router();

UserRouter.post('/login', VALIDATIONS.login, AuthController.login);
UserRouter.post('/register',uploadCloud.single('image'), VALIDATIONS.register, AuthController.register);
UserRouter.get('/profile', AuthMiddlewares.checkAuthorization, AuthController.getProfile);
UserRouter.put('/user' ,uploadCloud.single('image'),AuthMiddlewares.checkAuthorization, AuthController.updateUser)
UserRouter.post('/refresh-token', AuthController.refreshToken);

export default UserRouter;
