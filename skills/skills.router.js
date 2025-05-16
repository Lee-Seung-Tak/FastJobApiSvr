const express            = require('express');
const router             = express.Router();
const skillsController   = require('@skills_controller');




router.get('/list', skillsController.getAllSkills);
module.exports = router;


//router.patch('/skills');