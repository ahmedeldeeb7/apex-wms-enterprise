import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'apex_wms_secure_credential_secret_key';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Access session expired. Please refresh token.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid or expired token signature' });
    }
    
    // Support legacy schema matches
    req.user = {
      ...decoded,
      RoleName: decoded.role || decoded.RoleName,
      DepartmentName: decoded.department || decoded.DepartmentName
    };
    next();
  });
};

// Middleware to authorize based on Role Names
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session' });
    }

    const role = req.user.RoleName || req.user.role;

    // Admin has superuser access to everything
    if (role === 'Admin') {
      return next();
    }

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Access denied. Role '${role}' is not authorized for this operation.` 
    });
  };
};

export default authenticateToken;
