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
    const originalName = `${req.body.userId}_${file.fieldname}_${file.originalname}`;
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
 *                 example: frontend
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


router.get('/signup-verify', authController.signUpVerify)
  

module.exports = router;

