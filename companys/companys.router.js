// router.js
const express        = require('express')
const router         = express.Router();
const companysController = require('@companys_controller');


const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 저장 폴더
  },
  filename: function (req, file, cb) {
    const originalName = `${req.body.userId}_${file.fieldname}_${file.originalname}`;

    const uploadDir = 'uploads';
    
    // 기존 파일 삭제: req.userId와 file.fieldname이 포함된 파일들
    const files = fs.readdirSync(uploadDir);
    files.forEach((f) => {
      if (f.includes(`${req.userId}_${file.fieldname}_`)) {
        const targetPath = path.join(uploadDir, f);
        try {
          fs.unlinkSync(targetPath);
        } catch (err) {
          console.error(`delete failed: ${targetPath}`, err);
        }
      }
    });
    

    cb( null, originalName );
  }
});

const userData = multer({ storage: storage });


router.post('/signup', userData.any(), companysController.signUp);
module.exports = router;


//router.patch('/skills');