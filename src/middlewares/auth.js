import jwt from 'jsonwebtoken';

import { ENV } from '~/config/environment.js';

const checkAuthorization = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token', error });
    }
  } catch (error) {
    next(error);
  }
};

const checkAdmin = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const AuthMiddlewares = {
    checkAuthorization,
    checkAdmin
}