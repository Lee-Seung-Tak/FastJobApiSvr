const express            = require('express');
const router             = express.Router();
const usersController    = require('@users_controller');
const multer             = require('multer');
const path               = require('path');

router.patch('/user',      usersController.patchUser);
module.exports = router;
