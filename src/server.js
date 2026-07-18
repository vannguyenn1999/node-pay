import dns from 'dns';
import express from 'express';

import { ENV } from '~/config/environment.js';
import { CONNECT_TO_MONGO } from '~/config/mongodb.js';
import { CORS } from '~/config/cors.js';
import API_V1 from '~/routes/v1/index.js';
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware.js';
import { seedDefaultVipTiers } from '~/utils/vipSeeder.js';

// Force DNS resolution to prefer IPv4 first and use fallback IPv4 DNS servers (Google/Cloudflare)
// to avoid ECONNREFUSED/timeout errors caused by broken local IPv6 DNS configuration.
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Failed to configure DNS settings:', e.message);
}

const app = express();
app.use(CORS);
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  const originalJson = res.json;
  res.json = function (body) {
    console.log(`[API Response] ${res.statusCode} for ${req.method} ${req.url}`);
    return originalJson.call(this, body);
  };
  next();
});

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
    await seedDefaultVipTiers();
    START_SERVER();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(0); // Exit the process with an error code
  }
})();
