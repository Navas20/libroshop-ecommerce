const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const wompiConfig = require('../config/wompi');
const { verifyWompiSignature, generateIntegritySignature } = require('../utils/wompiSignature');
const logger = require('../utils/logger');

exports.createTransaction = async (req, res, next) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'order_id es requerido' });
    }

    // Validar que order_id sea un número válido
    const orderId = parseInt(order_id);
    if (isNaN(orderId) || orderId < 1) {
      return res.status(400).json({ success: false, error: 'order_id inválido' });
    }

    const [orders] = await pool.execute(
      'SELECT id, order_number, total, status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    const order = orders[0];

    if (order.status !== 'pendiente') {
      return res.status(400).json({ success: false, error: 'La orden no está pendiente' });
    }

    // Validar que el monto sea positivo y razonable
    const total = parseFloat(order.total);
    if (isNaN(total) || total <= 0 || total > 100000000) { // Máximo 100 millones COP
      logger.error(`Monto inválido en orden ${orderId}: ${total}`);
      return res.status(400).json({ success: false, error: 'Monto de orden inválido' });
    }

    const amountInCents = Math.round(total * 100);
    const reference = uuidv4();
    const currency = 'COP';
    const integrityHash = generateIntegritySignature(reference, amountInCents, currency);

    try {
      await axios.post(`${wompiConfig.baseUrl}/transactions`, {
        amount_in_cents: amountInCents,
        currency,
        reference,
        customer_email: req.user.email,
        payment_source_id: null,
        signature: integrityHash
      }, {
        headers: {
          Authorization: `Bearer ${wompiConfig.privateKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    } catch (wompiErr) {
      const msg = wompiErr.response?.data?.message || wompiErr.message;
      logger.error(`Error creando transacción en Wompi: ${msg}`);
      return res.status(502).json({ success: false, error: 'Error al comunicarse con la pasarela de pago' });
    }

    await pool.execute(
      'UPDATE orders SET wompi_reference = ? WHERE id = ?',
      [reference, order.id]
    );

    res.json({
      success: true,
      data: {
        reference,
        amountInCents,
        amount: parseFloat(order.total),
        currency,
        publicKey: wompiConfig.publicKey,
        integrityHash,
        orderId: order.id,
        orderNumber: order.order_number
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    const event = req.body;

    if (!event || !event.data || !event.data.transaction) {
      return res.status(400).json({ success: false, error: 'Payload inválido' });
    }

    const transaction = event.data.transaction;
    const signature = req.headers['x-wompi-signature'] || req.headers['x-signature'];

    if (signature) {
      const properties = [transaction.id, transaction.status, transaction.amount_in_cents];
      const isValid = verifyWompiSignature(properties, signature, wompiConfig.integrityKey);
      if (!isValid) {
        logger.warn(`Firma de webhook inválida: ${transaction.id}`);
        await pool.execute(
          'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details) VALUES (NULL, ?, ?, ?, ?)',
          ['WEBHOOK_INVALID_SIGNATURE', req.ip, req.get('User-Agent'), `Transacción: ${transaction.id}`]
        );
        return res.status(403).json({ success: false, error: 'Firma inválida' });
      }
    }

    try {
      const verification = await axios.get(
        `${wompiConfig.baseUrl}/transactions/${transaction.id}`,
        { headers: { Authorization: `Bearer ${wompiConfig.privateKey}` }, timeout: 10000 }
      );
      const verifiedStatus = verification.data.data.status;
      if (verifiedStatus !== transaction.status) {
        logger.warn(`Discrepancia de estado en webhook: tx=${transaction.id}`);
        return res.status(409).json({ success: false, error: 'Discrepancia en estado de transacción' });
      }
    } catch (verifyErr) {
      logger.error(`Error verificando transacción ${transaction.id}: ${verifyErr.message}`);
      return res.status(502).json({ success: false, error: 'Error verificando transacción con Wompi' });
    }

    const reference = transaction.reference;

    const [orders] = await pool.execute(
      "SELECT id, user_id, status FROM orders WHERE wompi_reference = ? OR order_number = ?",
      [reference, reference]
    );

    if (orders.length === 0) {
      logger.warn(`Webhook: orden no encontrada para referencia ${reference}`);
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    const order = orders[0];

    if (transaction.status === 'APPROVED') {
      await pool.execute(
        "UPDATE orders SET status = 'pagado', wompi_transaction_id = ?, wompi_reference = ? WHERE id = ?",
        [transaction.id, reference, order.id]
      );

      logger.info(`Pago aprobado para orden ${order.id}, transacción ${transaction.id}`);

      await pool.execute(
        'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)',
        [order.user_id, 'PAYMENT_APPROVED', req.ip, req.get('User-Agent'), `Orden: ${order.id}, Tx: ${transaction.id}`]
      );
    } else if (transaction.status === 'DECLINED') {
      await pool.execute(
        "UPDATE orders SET status = 'fallido', wompi_transaction_id = ? WHERE id = ?",
        [transaction.id, order.id]
      );

      try {
        const [orderItems] = await pool.execute(
          'SELECT book_key, quantity FROM order_items WHERE order_id = ?',
          [order.id]
        );
        for (const item of orderItems) {
          await pool.execute(
            'UPDATE book_stock SET quantity = quantity + ? WHERE book_key = ?',
            [item.quantity, item.book_key]
          );
        }
      } catch (stockErr) {
        logger.error(`Error restaurando stock para orden ${order.id}: ${stockErr.message}`);
      }

      logger.info(`Pago declinado para orden ${order.id}, transacción ${transaction.id}`);

      await pool.execute(
        'INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)',
        [order.user_id, 'PAYMENT_DECLINED', req.ip, req.get('User-Agent'), `Orden: ${order.id}, Tx: ${transaction.id}`]
      );
    }

    res.json({ success: true, data: { received: true } });
  } catch (err) {
    logger.error(`Error en webhook: ${err.message}`);
    res.status(500).json({ success: false, error: 'Error procesando webhook' });
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const { ref } = req.params;

    if (!ref) {
      return res.status(400).json({ success: false, error: 'Referencia requerida' });
    }

    const [orders] = await pool.execute(
      'SELECT id, total, status, wompi_transaction_id, wompi_reference FROM orders WHERE wompi_reference = ? AND user_id = ?',
      [ref, req.user.id]
    );

    let wompiData = null;
    try {
      const wompiResponse = await axios.get(
        `${wompiConfig.baseUrl}/transactions?reference=${ref}`,
        { headers: { Authorization: `Bearer ${wompiConfig.privateKey}` }, timeout: 10000 }
      );
      const transactions = wompiResponse.data.data;
      if (transactions && transactions.length > 0) {
        wompiData = {
          status: transactions[0].status,
          amount: transactions[0].amount_in_cents,
          currency: transactions[0].currency
        };
      }
    } catch (wompiErr) {
      logger.warn(`Error consultando Wompi para referencia ${ref}: ${wompiErr.message}`);
    }

    res.json({
      success: true,
      data: {
        reference: ref,
        order: orders.length > 0 ? orders[0] : null,
        wompi: wompiData || { status: 'unknown' }
      }
    });
  } catch (err) {
    next(err);
  }
};
