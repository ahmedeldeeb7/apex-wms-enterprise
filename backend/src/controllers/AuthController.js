import authService from '../services/AuthService.js';
import userRepository from '../repositories/UserRepository.js';

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password fields are required' });
      }

      const result = await authService.login(username, password);
      if (!result.success) {
        return res.status(401).json({ success: false, message: result.message });
      }

      // Set Secure HttpOnly cookie for Refresh Token rotation safety
      res.cookie('wms_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
      });

      return res.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.wms_refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Access session expired. Please sign in again.' });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      if (!result.success) {
        return res.status(403).json({ success: false, message: result.message });
      }

      return res.json({
        success: true,
        accessToken: result.accessToken
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const username = req.user?.username || 'Guest';
      res.clearCookie('wms_refresh_token');
      
      await userRepository.logAudit(username, 'Logout', 'Session', 'User', 'Session terminated by user request');
      
      return res.json({ success: true, message: 'Terminal session successfully cleared' });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await userRepository.findByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Operator profile template not found' });
      }
      return res.json({
        success: true,
        user: {
          id: user.UserID,
          username: user.Username,
          role: user.role,
          department: user.department
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
export { AuthController };
