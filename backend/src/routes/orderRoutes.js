const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

router.use(auth);
router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
