import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect — JWT authentication middleware.
 *
 * Reads the Authorization header (Bearer <token>), verifies it with
 * JWT_SECRET, performs a DB lookup to confirm the user still exists,
 * and attaches the full user document (minus passwordHash) to req.user.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Not authorised — user no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised — token invalid or expired' });
  }
};

export default protect;
