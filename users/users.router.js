const express            = require('express');
const usersController    = require('@users_controller');
const multer             = require('multer');
const fs                 = require('fs');
const path               = require('path');
const router             = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 저장 폴더
  },
  filename: function (req, file, cb) {
    // 원본 이름에서 특수문자·깨진 문자 제거
    const safeOriginal = file.originalname
      .normalize('NFC')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    const filename = `${req.userId}_${file.fieldname}_${safeOriginal}`;

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

    cb(null, filename);
  }
});
const userData = multer({ storage: storage });
  // const userData = multer({ storage }).fields([
  //   { name: 'resumeFile',     maxCount: 1 },
  //   { name: 'selfIntroFile',  maxCount: 1 },
  //   { name: 'careerDescFile', maxCount: 1 },
  // ]);
/**
 * @swagger
 * /users/user:
 *   patch:
 *     summary: 사용자 비밀번호 및 전화번호 수정
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *                 example: johndoe122
 *               oldPassword:
 *                 type: string
 *                 description: 기존 비밀번호 (비밀번호만 변경 시 필수)
 *                 example: StrongPass3!
 *               newPassword:
 *                 type: string
 *                 description: 새 비밀번호 (비밀번호만 변경 시 필수)
 *                 example: StrongPass4!
 *               confirmPassword:
 *                 type: string
 *                 description: 새 비밀번호 재입력 (newPassword와 동일해야 함)
 *                 example: StrongPass4!
 *               phone:
 *                 type: string
 *                 description: 새 전화번호 (전화번호만 변경 시 필수)
 *                 example: 010-2929-2929
 *     responses:
 *       200:
 *         description: 사용자 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User information updated successfully
 *       400:
 *         description: 잘못된 요청 (비밀번호 불일치 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: New passwords do not match
 *       401:
 *         description: 인증 실패 (기존 비밀번호 오류)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Old password is incorrect
 */
// 사용자 정보 수정
router.patch('/user', usersController.patchUser);

// 유저 본인 정보 조회
router.get('/me', usersController.getUser);
router.get('/my-job-application', usersController.myJobApplications);

router.patch('/user/application-docs', userData.any(), usersController.patchUserProfileDocs);
// TO Do - 1
// 사용자 이력서 및 자기소개서, 경력 기술서, 포트폴리오 url 업데이트
//router.update('/user')

module.exports = router;
