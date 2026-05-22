import express from 'express';
import authController from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimiter from '../middleware/rateLimiter.js';
import { validateBody, loginSchema } from '../middleware/validation.js';

const router = express.Router();

// Brute-force protection: max 10 login attempts per minute per IP
const loginLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10
});

// @route   POST api/auth/login
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);

// @route   POST api/auth/refresh
router.post('/refresh', authController.refresh);

// @route   POST api/auth/logout
router.post('/logout', authenticateToken, authController.logout);

// @route   GET api/auth/me
router.get('/me', authenticateToken, authController.getMe);

export default router;
