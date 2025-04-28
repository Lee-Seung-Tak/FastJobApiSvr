// router.js
const express        = require('express')
const router         = express.Router();
const authController = require('@auth_controller');


const multer         = require('multer');
const userData       = multer( { dest: 'uploads/'} );

router.post('/login',  authController.login);
router.post('/signup', userData.any(), authController.signUp);
module.exports = router;
