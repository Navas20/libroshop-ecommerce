const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"LibroShop" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text
    });

    logger.info(`Email enviado a ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Error enviando email a ${to}: ${err.message}`);
    throw err;
  }
}

async function sendVerificationEmail(to, token) {
  const url = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;

  return sendEmail({
    to,
    subject: 'Verifica tu correo - LibroShop',
    html: `<h1>LibroShop</h1><p>Haz clic en el siguiente enlace para verificar tu correo:</p><a href="${url}">${url}</a><p>Este enlace expira en 24 horas.</p>`,
    text: `Verifica tu correo en LibroShop: ${url}`
  });
}

async function sendPasswordResetEmail(to, token) {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  return sendEmail({
    to,
    subject: 'Restablece tu contraseña - LibroShop',
    html: `<h1>LibroShop</h1><p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><a href="${url}">${url}</a><p>Este enlace expira en 1 hora.</p>`,
    text: `Restablece tu contraseña en LibroShop: ${url}`
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
