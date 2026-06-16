import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  HOSTNAME: process.env.HOSTNAME,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  BUILD_MODE: process.env.BUILD_MODE,
  API_SECRET: process.env.API_SECRET,
  API_KEY: process.env.API_KEY,
  CLOUD_NAME: process.env.CLOUD_NAME,
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
  PAYOS_API_KEY: process.env.PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY
};
