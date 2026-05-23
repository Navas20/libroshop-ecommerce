const axios = require('axios');
const pool = require('../config/db');
const logger = require('../utils/logger');

const OPEN_LIBRARY = 'https://openlibrary.org';

const getOrCreatePrice = async (bookKey) => {
  try {
    const [existing] = await pool.execute(
      'SELECT price_original, price_final FROM book_prices WHERE book_key = ?',
      [bookKey]
    );
    if (existing.length > 0) {
      return { original: parseFloat(existing[0].price_original), final: parseFloat(existing[0].price_final), discount_percent: 20 };
    }
  } catch (err) {
    logger.warn(`Error consultando precio para ${bookKey}: ${err.message}`);
  }

  const hash = bookKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = ((hash % 80000) + 20000);
  const original = Math.round(base / 1000) * 1000;
  const final = Math.round(original * 0.8);

  try {
    await pool.execute(
      'INSERT INTO book_prices (book_key, price_original, price_final) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price_original = VALUES(price_original), price_final = VALUES(price_final)',
      [bookKey, original, final]
    );
  } catch (err) {
    logger.warn(`Error guardando precio para ${bookKey}: ${err.message}`);
  }

  return { original, final, discount_percent: 20 };
};

const extractBookData = (apiBook) => {
  const key = (apiBook.key || '').replace(/^\//, '');
  const coverId = apiBook.cover_i || apiBook.cover_id;
  return {
    key,
    title: apiBook.title || 'Sin título',
    author_name: apiBook.author_name ? apiBook.author_name : (apiBook.authors ? apiBook.authors.map(a => a.name) : ['Autor desconocido']),
    cover_i: coverId || null,
    cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    first_publish_year: apiBook.first_publish_year || null,
    subject: apiBook.subject ? apiBook.subject.slice(0, 5) : []
  };
};

exports.search = async (req, res, next) => {
  try {
    let { q, page, limit } = req.query;
    q = (q || '').trim();
    page = parseInt(page) || 1;
    limit = Math.min(parseInt(limit) || 20, 50);

    if (!q) {
      return res.status(400).json({ success: false, error: 'Parámetro de búsqueda requerido' });
    }

    // Validación adicional: prevenir inyección
    if (q.length > 200) {
      return res.status(400).json({ success: false, error: 'Búsqueda demasiado larga' });
    }

    // Validar que page y limit sean números válidos
    if (isNaN(page) || page < 1 || page > 10000) {
      return res.status(400).json({ success: false, error: 'Página inválida' });
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ success: false, error: 'Límite inválido' });
    }

    const offset = (page - 1) * limit;

    const response = await axios.get(`${OPEN_LIBRARY}/search.json`, {
      params: { q, page, limit, fields: 'key,title,author_name,cover_i,first_publish_year,subject' },
      timeout: 10000
    });

    const total = response.data.numFound || 0;
    const apiBooks = response.data.docs || [];

    const books = await Promise.all(apiBooks.map(async (apiBook) => {
      const bookData = extractBookData(apiBook);
      const price = await getOrCreatePrice(bookData.key);
      return { ...bookData, price };
    }));

    res.json({
      success: true,
      data: { books, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ success: false, error: 'La búsqueda tardó demasiado. Intenta de nuevo.' });
    }
    if (err.response && err.response.status === 429) {
      return res.status(429).json({ success: false, error: 'Demasiadas solicitudes a Open Library. Intenta más tarde.' });
    }
    next(err);
  }
};

exports.featured = async (req, res, next) => {
  try {
    const queries = ['new releases', 'bestsellers', 'award winning'];
    const labels = ['newReleases', 'bestsellers', 'awardWinning'];

    const results = await Promise.all(queries.map(async (query) => {
      try {
        const response = await axios.get(`${OPEN_LIBRARY}/search.json`, {
          params: { q: query, limit: 12, sort: 'new', fields: 'key,title,author_name,cover_i,first_publish_year,subject' },
          timeout: 10000
        });
        const apiBooks = response.data.docs || [];
        return await Promise.all(apiBooks.map(async (apiBook) => {
          const bookData = extractBookData(apiBook);
          const price = await getOrCreatePrice(bookData.key);
          return { ...bookData, price };
        }));
      } catch (err) {
        logger.warn(`Error fetching featured "${query}": ${err.message}`);
        return [];
      }
    }));

    const featuredData = {};
    labels.forEach((label, index) => { featuredData[label] = results[index]; });

    res.json({ success: true, data: featuredData });
  } catch (err) {
    next(err);
  }
};

exports.getByKey = async (req, res, next) => {
  try {
    let { key } = req.params;
    key = key.replace(/^\//, '');
    if (!key.startsWith('works/')) key = 'works/' + key;
    key = '/' + key;

    const response = await axios.get(`${OPEN_LIBRARY}${key}.json`, { timeout: 10000 });
    const apiBook = response.data;

    const coverId = apiBook.covers ? apiBook.covers[0] : null;

    let authorsList = 'Autor desconocido';
    if (apiBook.authors && apiBook.authors.length > 0) {
      try {
        const authorPromises = apiBook.authors.slice(0, 3).map(async (a) => {
          try {
            const authorRes = await axios.get(`${OPEN_LIBRARY}${a.author.key}.json`, { timeout: 5000 });
            return authorRes.data.name;
          } catch { return a.author.key || 'Unknown'; }
        });
        authorsList = (await Promise.all(authorPromises)).join(', ');
      } catch { authorsList = 'Autor desconocido'; }
    }

    const description = apiBook.description
      ? (typeof apiBook.description === 'string' ? apiBook.description : (apiBook.description.value || ''))
      : '';

    const subjects = apiBook.subjects ? apiBook.subjects.slice(0, 10) : [];
    const price = await getOrCreatePrice(key);

    let stock = null;
    try {
      const [stockRows] = await pool.execute(
        'SELECT quantity FROM book_stock WHERE book_key = ?',
        [key]
      );
      if (stockRows.length > 0) {
        stock = { quantity: stockRows[0].quantity, available: stockRows[0].quantity };
      }
    } catch (err) {
      logger.warn(`Error al obtener stock: ${err.message}`);
    }

    res.json({
      success: true,
      data: {
        key,
        title: apiBook.title || 'Sin título',
        author: authorsList,
        cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
        description,
        subjects,
        pages: apiBook.number_of_pages || null,
        publishDate: apiBook.publish_date || null,
        price,
        stock
      }
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ success: false, error: 'Libro no encontrado' });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, error: 'La consulta tardó demasiado.' });
    }
    next(err);
  }
};
