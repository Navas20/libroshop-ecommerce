const pool = require('../config/db');
const logger = require('../utils/logger');

exports.getCart = async (req, res, next) => {
  try {
    const [items] = await pool.query(
      'SELECT id, book_key, book_title, book_author, book_cover, price, quantity, created_at FROM cart_items WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    res.json({
      success: true,
      data: {
        items,
        total: Math.round(total * 100) / 100,
        count: items.length
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { book_key, book_title, book_author, book_cover, price, quantity } = req.body;

    if (!book_key || !book_title || !price || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'book_key, book_title, price y quantity son requeridos'
      });
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1 || qty > 99) {
      return res.status(400).json({ success: false, error: 'La cantidad debe estar entre 1 y 99' });
    }

    const itemPrice = parseFloat(price);
    if (isNaN(itemPrice) || itemPrice <= 0) {
      return res.status(400).json({ success: false, error: 'Precio inválido' });
    }

    try {
      const [stockRows] = await pool.query(
        'SELECT quantity, reserved FROM book_stock WHERE book_key = ?',
        [book_key]
      );

      if (stockRows.length > 0) {
        const stock = stockRows[0];
        const available = stock.quantity - (stock.reserved || 0);

        const [existingCart] = await pool.query(
          'SELECT quantity FROM cart_items WHERE user_id = ? AND book_key = ?',
          [req.user.id, book_key]
        );

        const totalRequested = existingCart.length > 0 ? existingCart[0].quantity + qty : qty;

        if (totalRequested > available) {
          return res.status(409).json({
            success: false,
            error: `Stock insuficiente. Disponible: ${available}`
          });
        }
      }
    } catch (err) {
      logger.warn(`No se pudo verificar stock para ${book_key}: ${err.message}`);
    }

    await pool.query(
      `INSERT INTO cart_items (user_id, book_key, book_title, book_author, book_cover, price, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, book_key, book_title, book_author, book_cover || null, itemPrice, qty]
    );

    const [updated] = await pool.query(
      'SELECT id, book_key, book_title, book_author, book_cover, price, quantity FROM cart_items WHERE user_id = ? AND book_key = ?',
      [req.user.id, book_key]
    );

    res.status(201).json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity);
    if (!qty || qty < 1 || qty > 99) {
      return res.status(400).json({ success: false, error: 'La cantidad debe estar entre 1 y 99' });
    }

    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [qty, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Item no encontrado en el carrito' });
    }

    const [updated] = await pool.query(
      'SELECT id, book_key, book_title, book_author, book_cover, price, quantity FROM cart_items WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Item no encontrado en el carrito' });
    }

    res.json({ success: true, data: { message: 'Item eliminado del carrito' } });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    res.json({ success: true, data: { message: 'Carrito vaciado exitosamente' } });
  } catch (err) {
    next(err);
  }
};
