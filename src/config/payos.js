import PayOS from '@payos/node';

import { ENV } from './environment.js';

const PAYOS = new PayOS({
  clientId: ENV.PAYOS_CLIENT_ID,
  apiKey: ENV.PAYOS_API_KEY,
  checksumKey: ENV.PAYOS_CHECKSUM_KEY,
  sandbox: true, // Set to false for production
});

export default PAYOS;