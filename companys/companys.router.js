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

/**
 * @swagger
 * /companys/signup:
 *   post:
 *     summary: 회사 회원가입 (이메일 인증)
 *     description: 신규 회사 계정을 생성하고 인증 메일을 발송합니다. 인증 완료 시 계정이 활성화됩니다.
 *     tags: [Companys]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - address
 *               - userId
 *               - password
 *               - business
 *             properties:
 *               name:
 *                 type: string
 *                 description: 회사명
 *                 example: FastJob Inc.
 *               email:
 *                 type: string
 *                 description: 회사 이메일
 *                 example: hr@fastjob.com
 *               phone:
 *                 type: string
 *                 description: 연락처
 *                 example: 02-1234-5678
 *               address:
 *                 type: string
 *                 description: 회사 주소
 *                 example: 서울특별시 강남구 테헤란로 123
 *               userId:
 *                 type: string
 *                 description: 로그인용 회사 ID
 *                 example: fastjob_hr
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *                 example: SecurePass123!
 *               business:
 *                 type: integer
 *                 description: "사업 분야 ID (예: 1 = SI, 2 = 임베디드, 3 = LLM 등)"
 *                 example: 1
 *     responses:
 *       201:
 *         description: 회원가입 성공. 이메일 인증 필요.
 *         content:
 *           application/json:
 *             example:
 *               message: Once you have completed your email authentication, your account will be activated.
 *       400:
 *         description: 잘못된 입력 또는 누락된 필드.
 *         content:
 *           application/json:
 *             example:
 *               message: Bad Request
 */
router.post('/signup', userData.any(), companysController.signUp);

/**
 * @swagger
 * /companys/login:
 *   post:
 *     summary: 회사 사용자 로그인
 *     description: 사용자 ID와 비밀번호로 로그인하고, access_token과 refresh_token을 반환합니다.
 *     tags:
 *       - Companys
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *                 example: test1
 *               password:
 *                 type: string
 *                 example: test1234
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly Refresh Token 쿠키로 전달
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: 요청 유효성 실패 (DTO 오류 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bad Request
 *       401:
 *         description: 인증 실패 (userId 또는 password 오류)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: check your id or password
 */
router.post('/login',  companysController.login);

/**
 * @swagger
 * /companys/signup-verify:
 *   get:
 *     summary: "회원가입 검증"
 *     description: "Bearer 토큰을 사용하여 회원가입을 검증합니다. 토큰이 정상적인 경우 400을, 비정상적인 경우 401을 반환합니다."
 *     tags:
 *       - "Companys"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "정상 토큰으로 확인됨."
 *       400:
 *         description: "이미 가입된 사용자입니다."
 *       401:
 *         description: "유효하지 않은 토큰입니다."
 *       500:
 *         description: "서버 오류."
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: "Bearer 토큰"
 *         schema:
 *           type: string
 *           example: "Bearer your_token_here"
 */
router.get('/signup-verify', companysController.signUpVerify);
module.exports = router;
