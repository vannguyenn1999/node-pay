import express from 'express';

import { ENV } from '~/config/environment.js';
import { CONNECT_TO_MONGO } from '~/config/mongodb.js';
import { CORS } from '~/config/cors.js';
import API_V1 from '~/routes/v1/index.js';
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware.js';

const app = express();
app.use(CORS);
app.use(express.json());

// const PORT = ENV.PORT || 5000

const START_SERVER = () => {
  app.use('/api/v1', API_V1);
  app.use(errorHandlingMiddleware);

  app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`Hello Văn Nguyễn , I am running at ${ENV.HOSTNAME}:${ENV.PORT}/`);
  });
};

(async () => {
  try {
    await CONNECT_TO_MONGO();
    START_SERVER();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(0); // Exit the process with an error code
  }
})();
