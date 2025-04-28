// router.js
const express        = require('express')
const router         = express.Router();
const authController = require('@auth_controller');
const middleWare     = require('@middleware')
// EndPoint
// router.post('/login', middleWare.verifyToken, authController.login);
router.post('/login',  authController.login);
router.post('/signup', authController.signUp);
module.exports = router;
