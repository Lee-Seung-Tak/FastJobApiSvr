// router.js
const express        = require('express')
const router         = express.Router();
const authController = require('@auth_controller');

// EndPoint
router.post('/login', authController.login);

module.exports = router;
