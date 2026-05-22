const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

exports.createOrder = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { nombre_destinatario, email_destinatario, direccion, ciudad, codigo_postal } = req.body;

    if (!direccion || !ciudad) {
      connection.release();
      return res.status(400).json({ success: false, error: 'Dirección y ciudad son requeridas' });
    }

    const [cartItems] = await connection.execute(
      'SELECT book_key, book_title, book_author, book_cover, price, quantity FROM cart_items WHERE user_id = ?',
      [req.user.id]
    );

    if (cartItems.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, error: 'El carrito está vacío' });
    }

    await connection.beginTransaction();

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const descuento = Math.round(subtotal * 0.2);
    const total = subtotal - descuento;
    const orderNumber = uuidv4();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, order_number, subtotal, descuento, total, status, nombre_destinatario, email_destinatario, direccion, ciudad, codigo_postal)
       VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?)`,
      [req.user.id, orderNumber, subtotal, descuento, total, nombre_destinatario || req.user.nombre, email_destinatario || req.user.email, direccion, ciudad, codigo_postal || null]
    );

    const orderId = orderResult.insertId;

    const orderItemsValues = cartItems.map(item => [
      orderId, item.book_key, item.book_title, item.book_author, item.book_cover, item.price, item.quantity
    ]);

    await connection.query(
      'INSERT INTO order_items (order_id, book_key, book_title, book_author, book_cover, price, quantity) VALUES ?',
      [orderItemsValues]
    );

    await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        order_number: orderNumber,
        subtotal,
        descuento,
        total,
        status: 'pendiente'
      }
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error creando orden: ${err.message}`);
    next(err);
  } finally {
    connection.release();
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [req.user.id]
    );
    const total = countResult[0].total;

    const [orders] = await pool.execute(
      'SELECT id, order_number, subtotal, descuento, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.execute(
        'SELECT id, book_key, book_title, book_author, book_cover, price, quantity FROM order_items WHERE order_id = ?',
        [order.id]
      );
      return { ...order, items };
    }));

    res.json({
      success: true,
      data: {
        orders: ordersWithItems,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.execute(
      'SELECT id, user_id, order_number, subtotal, descuento, total, status, nombre_destinatario, email_destinatario, direccion, ciudad, codigo_postal, wompi_transaction_id, wompi_reference, created_at FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    const [items] = await pool.execute(
      'SELECT id, book_key, book_title, book_author, book_cover, price, quantity FROM order_items WHERE order_id = ?',
      [id]
    );

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (err) {
    next(err);
  }
};
