const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401);
    next(new Error('Not authorized, token failed'));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error(`Role '${req.user.role}' is not authorized for this action`));
  }
  next();
};

module.exports = { protect, authorize };
