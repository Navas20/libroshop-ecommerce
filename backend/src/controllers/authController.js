const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const jwtConfig = require('../config/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const logger = require('../utils/logger');

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [result] = await pool.execute(
      'INSERT INTO users (nombre, email, password, email_verify_token, email_verify_expires) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, verificationToken, verifyExpires]
    );

    const user = { id: result.insertId, email };

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [result.insertId, tokenHash, expiresAt]
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    });

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      logger.warn('Error enviando email de verificación: ' + emailErr.message);
    }

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: { id: result.insertId, nombre, email }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    }

    const [users] = await pool.execute(
      'SELECT id, nombre, email, password, email_verified, failed_login_attempts, locked_until FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const user = users[0];

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        error: `Cuenta bloqueada. Intenta de nuevo en ${remaining} minutos.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      if (newAttempts >= 5) {
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await pool.execute(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [newAttempts, lockedUntil, user.id]
        );
        logger.warn(`Cuenta bloqueada por 30 min: ${email}`);
        await pool.execute(
          'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)',
          [user.id, 'ACCOUNT_LOCKED', req.ip, req.get('User-Agent'), '5 intentos fallidos de login']
        );
        return res.status(423).json({
          success: false,
          error: 'Demasiados intentos fallidos. Cuenta bloqueada por 30 minutos.'
        });
      }
      await pool.execute(
        'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
        [newAttempts, user.id]
      );
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    await pool.execute(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    const tokenUser = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(tokenUser);
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    });

    await pool.execute(
      'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'LOGIN_SUCCESS', req.ip, req.get('User-Agent'), 'Login exitoso']
    );

    res.json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, nombre: user.nombre, email: user.email }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token requerido' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Refresh token inválido o expirado' });
    }

    const tokenHash = hashToken(refreshToken);
    const [storedTokens] = await pool.execute(
      'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = ? AND user_id = ?',
      [tokenHash, decoded.id]
    );

    if (storedTokens.length === 0) {
      return res.status(401).json({ success: false, error: 'Refresh token no encontrado' });
    }

    const storedToken = storedTokens[0];
    if (new Date(storedToken.expires_at) <= new Date()) {
      await pool.execute('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);
      return res.status(401).json({ success: false, error: 'Refresh token expirado' });
    }

    const [users] = await pool.execute('SELECT id, nombre, email FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }

    const user = users[0];
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newTokenHash = hashToken(newRefreshToken);

    await pool.execute('DELETE FROM refresh_tokens WHERE id = ?', [storedToken.id]);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, newTokenHash, expiresAt]
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    });

    res.json({ success: true, data: { message: 'Sesión cerrada exitosamente' } });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, nombre, email, email_verified FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const user = users[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        email_verified: !!user.email_verified
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requerido' });
    }

    const [users] = await pool.execute(
      'SELECT id, email_verify_expires FROM users WHERE email_verify_token = ? AND email_verified = FALSE',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, error: 'Token inválido o correo ya verificado' });
    }

    const user = users[0];
    if (user.email_verify_expires && new Date(user.email_verify_expires) <= new Date()) {
      return res.status(400).json({ success: false, error: 'Token de verificación expirado' });
    }

    await pool.execute(
      'UPDATE users SET email_verified = TRUE, email_verify_token = NULL, email_verify_expires = NULL WHERE id = ?',
      [user.id]
    );

    logger.info(`Email verificado para usuario ${user.id}`);
    res.json({ success: true, data: { message: 'Correo verificado exitosamente' } });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email requerido' });
    }

    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);

    if (users.length > 0) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await pool.execute(
        'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
        [resetToken, resetExpires, users[0].id]
      );

      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailErr) {
        logger.warn('Error enviando email de recuperación: ' + emailErr.message);
      }
    }

    res.json({
      success: true,
      data: { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' }
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token y nueva contraseña requeridos' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const [users] = await pool.execute(
      'SELECT id, reset_password_expires FROM users WHERE reset_password_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }

    const user = users[0];
    if (!user.reset_password_expires || new Date(user.reset_password_expires) <= new Date()) {
      return res.status(400).json({ success: false, error: 'Token expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.execute(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL, failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);

    logger.info(`Contraseña restablecida para usuario ${user.id}`);
    res.json({ success: true, data: { message: 'Contraseña restablecida exitosamente' } });
  } catch (err) {
    next(err);
  }
};
