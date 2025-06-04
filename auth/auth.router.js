// router.js
const express        = require('express')
const router         = express.Router();
const authController = require('@auth_controller');


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
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Logs in a user with userId and password, and returns access and refresh tokens.
 *     tags:
 *       - Auth
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
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refresh_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: "Bad Request (e.g., missing fields or invalid format)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bad Request
 *       401:
 *         description: "Authentication failed (incorrect userId or password)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: check your id or password
 */
router.post('/login',  authController.login);


/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: User registration with email verification
 *     description: Registers a new user. Email authentication is required before the account is activated.
 *     tags: [Auth]
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
 *               - userId
 *               - password
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: User's email address
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *                 example: 010-1234-5678
 *               userId:
 *                 type: string
 *                 description: Unique user ID (used for login)
 *                 example: johndoe123
 *               password:
 *                 type: string
 *                 description: Account password
 *                 example: StrongPass1!
 *               category:
 *                 type: string
 *                 description: User's job category or field of interest
 *                 example: 1
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Upload resume file (optional)
 *               resumeUrl:
 *                 type: string
 *                 description: External URL for resume (optional)
 *                 example: https://example.com/resume.pdf
 *               selfIntro:
 *                 type: string
 *                 format: binary
 *                 description: Upload self-introduction file (optional)
 *               selfIntroUrl:
 *                 type: string
 *                 description: External URL for self-introduction (optional)
 *                 example: https://example.com/intro.pdf
 *               carrer_desc:
 *                 type: string
 *                 format: binary
 *                 description: Upload career description file (optional)
 *               careerDescUrl:
 *                 type: string
 *                 description: External URL for career description (optional)
 *                 example: https://example.com/career.pdf
 *               portpolioUrl:
 *                 type: string
 *                 description: External link to portfolio (optional)
 *                 example: https://portfolio.example.com
 *               skills:
 *                 type: array
 *                 description: List of skill IDs (as integers)
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Successfully registered. Awaiting email verification.
 *         content:
 *           application/json:
 *             example:
 *               message: Once you have completed your email authentication, your account will be activated.
 *       400:
 *         description: Missing or invalid fields.
 *         content:
 *           application/json:
 *             example:
 *               message: Bad Request
 */
router.post('/signup', userData.any(), authController.signUp);

/**
 * @swagger
 * /auth/signup-verify:
 *   get:
 *     summary: "회원가입 검증"
 *     description: "Bearer 토큰을 사용하여 회원가입을 검증합니다. 토큰이 정상적인 경우 400을, 비정상적인 경우 401을 반환합니다."
 *     tags:
 *       - "Auth"
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
router.get('/signup-verify', authController.signUpVerify);


/**
 * @swagger
 * /auth/token-refresh:
 *   post:
 *     summary: Access Token 갱신
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: 갱신 토큰
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0MSIsImlhdCI6MTc0NzE5MTYzNCwiZXhwIjoxNzQ3Nzk2NDM0fQ.9jagB1k6Y_tclrZfiJf4x1yUnc5lYzNoMI6oOM8gzZ8"
 *     responses:
 *       200:
 *         description: Access Token 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: 새로 발급된 Access Token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0MSIsImlhdCI6MTc0NzE5MTY4MiwiZXhwIjoxNzQ3MTk1MjgyfQ.lOziyrvmI5JWbxFxNyV6H5LJXoCpfilKR6Fl7ziXWbk"
 *                     refresh_token:
 *                       type: string
 *                       description: 새로 발급된 Refresh Token 
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0MSIsImlhdCI6MTc0NzE5MTY4MiwiZXhwIjoxNzQ3Nzk2NDgyfQ.JhaVbmBGUGoVo0j-Ce-l47ti0oZV9vLfa6ixZ9tx-t4"
 *       401:
 *         description: 유효하지 않거나 만료된 Refresh Token
 *       500:
 *         description: 서버 오류
 */

router.post('/token-refresh', authController.tokenRefresh);

router.post('/reset-password', authController.resetPassword)
router.get('/reset-password/token-verify', authController.resetPasswordTokenVerify)
router.patch('/new-password', authController.updateNewPassword)
router.post('/recover-id-request', authController.getUserIdByEmail)
router.get('/find-id',authController.showRecoveredId)
module.exports = router;

