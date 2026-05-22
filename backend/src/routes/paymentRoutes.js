const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { paymentLimiter } = require('../middlewares/rateLimiter');
const wompiWebhookValidator = require('../middlewares/wompiWebhookValidator');
const paymentController = require('../controllers/paymentController');

router.post('/create', auth, paymentLimiter, paymentController.createTransaction);
router.post('/webhook', wompiWebhookValidator, paymentController.webhook);
router.get('/status/:ref', auth, paymentController.getStatus);

module.exports = router;
