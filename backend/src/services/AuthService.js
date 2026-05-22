import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userRepository from '../repositories/UserRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'apex_wms_secure_credential_secret_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'apex_wms_secure_refresh_secret_key';

class AuthService {
  async login(username, password) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.IsActive) {
      return { success: false, message: 'Terminal account is deactivated by AD' };
    }

    // 1. Password Verification (Supporting plain-text-to-bcrypt migration)
    let isMatch = false;
    const isBcrypt = user.PasswordHash.startsWith('$2a$') || user.PasswordHash.startsWith('$2b$');

    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, user.PasswordHash);
    } else {
      isMatch = password === user.PasswordHash;
      // Automatic secure migration to bcrypt hash
      if (isMatch) {
        console.log(`Auto migrating plaintext password seed for user [${username}]...`);
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(password, salt);
        await userRepository.updatePasswordHash(user.UserID, newHash);
      }
    }

    if (!isMatch) {
      await userRepository.logFailedAttempt(username, 'Password verification failed');
      return { success: false, message: 'Invalid credentials' };
    }

    // 2. Generate security tokens
    const payload = {
      id: user.UserID,
      username: user.Username,
      role: user.role,
      department: user.department
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // 3. Log Successful Session Entry
    await userRepository.createLoginAudit(username);
    await userRepository.logAudit(username, 'Login', user.UserID.toString(), 'User', 'Session established');

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.UserID,
        username: user.Username,
        role: user.role,
        department: user.department
      }
    };
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  }

  async verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      const user = await userRepository.findByUsername(decoded.username);
      if (!user || !user.IsActive) {
        return { success: false, message: 'Invalid session or account deactivated' };
      }

      const payload = {
        id: user.UserID,
        username: user.Username,
        role: user.role,
        department: user.department
      };

      const newAccessToken = this.generateAccessToken(payload);
      return { success: true, accessToken: newAccessToken };
    } catch (err) {
      return { success: false, message: 'Refresh token expired or invalid' };
    }
  }
}

export default new AuthService();
export { AuthService };
