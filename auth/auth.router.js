// router.js
const express        = require('express')
const router         = express.Router();
const authController = require('@auth_controller');


const multer         = require('multer');
const path           = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 저장 폴더
  },
  filename: function (req, file, cb) {
    const originalName = `${req.body.user_id}_${file.fieldname}_${file.originalname}`;
    cb( null, originalName );
  }
});

const userData = multer({ storage: storage });

router.post('/login',  authController.login);
router.post('/signup', userData.any(), authController.signUp);
module.exports = router;
