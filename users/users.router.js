const express            = require('express');
const usersController    = require('@users_controller');
const multer             = require('multer');
const path               = require('path');

const router             = express.Router();

router.patch('/user', usersController.patchUser);
module.exports = router;
