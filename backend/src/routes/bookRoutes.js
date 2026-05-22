const router = require('express').Router();
const bookController = require('../controllers/bookController');

router.get('/search', bookController.search);
router.get('/featured', bookController.featured);
router.get('/:key', bookController.getByKey);

module.exports = router;
