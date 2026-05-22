const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');

router.use(auth);
router.get('/', cartController.getCart);
router.post('/', cartController.addItem);
router.put('/:id', cartController.updateQuantity);
router.delete('/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
