import express from 'express';

import { SerieController } from '~/controllers/serieController.js';
import {AuthMiddlewares} from '~/middlewares/auth'

const SerieRouter = express.Router();
const adminAuth = [AuthMiddlewares.checkAuthorization, AuthMiddlewares.checkAdmin];


SerieRouter.route('/')
  .get(SerieController.getAllSeries)
  .post(...adminAuth, SerieController.createSerie);

// GET, PUT, DELETE specific Serie
SerieRouter.route('/:id')
  .get(SerieController.getSerieById)
  .put(...adminAuth, SerieController.updateSerie)
  .delete(...adminAuth, SerieController.deleteSerie);

export default SerieRouter;
