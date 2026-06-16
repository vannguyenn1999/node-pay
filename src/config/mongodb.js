import mongoose from 'mongoose';
import { ENV } from '~/config/environment.js';

mongoose.set('strictQuery', true);

export const CONNECT_TO_MONGO = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const getDB = () => {
  if (!mongoose.connection || !mongoose.connection.readyState) {
    throw new Error('Database connection not established. Please call CONNECT_TO_MONGO first.');
  }
  return mongoose.connection.db;
};
