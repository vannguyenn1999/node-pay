/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */

import cors from 'cors';

const CORS_OPTIONS = {
  // origin: [
  //   'http://localhost:5173',
  //   'http://localhost:3000',
  //   'http://127.0.0.1:5173',
  //   'http://127.0.0.1:3000',
  //   'https://mindx-reactjs-final-test-kgd5.vercel.app',
  //   'https://react-pay-gamma.vercel.app/'
  // ],
  origin : true,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const CORS = cors(CORS_OPTIONS);
