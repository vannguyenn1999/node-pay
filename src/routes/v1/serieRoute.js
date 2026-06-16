import express from 'express';

import { SerieController } from '~/controllers/serieController.js';

const SerieRouter = express.Router();

SerieRouter.route('/')
  .get(SerieController.getAllSeries)
  .post(SerieController.createSerie);

// GET, PUT, DELETE specific Serie
SerieRouter.route('/:id')
  .get(SerieController.getSerieById)
  .put(SerieController.updateSerie)
  .delete(SerieController.deleteSerie);

export default SerieRouter;
