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

const companyData = multer({ storage: storage });

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
 *               - companyId
 *               - password
 *               - business
 *             properties:
 *               name:
 *                 type: string
 *                 description: company name
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
 *               companyId:
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
router.post('/signup', companyData.any(), companysController.signUp);

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
 *               - companyId
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

/**
 * @swagger
 * /companys/token-refresh:
 *   post:
 *     summary: Access Token 갱신
 *     tags: [Companys]
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
router.post('/token-refresh', companysController.tokenRefresh);

/**
 * @swagger
 * /companys/reset-password:
 *   post:
 *     summary: 비밀번호 재설정 이메일 전송
 *     tags: [Companys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: 사용자 이메일
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 메일 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reset password email sent successfully"
 *       400:
 *         description: 잘못된 요청 또는 존재하지 않는 이메일
 *       500:
 *         description: 서버 오류
 */
router.post('/reset-password', companysController.resetPassword)

/**
 * @swagger
 * /companys/reset-password/verify:
 *   get:
 *     summary: 비밀번호 재설정 토큰 검증 및 페이지 제공
 *     tags: [Companys]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: 이메일로 전달된 비밀번호 재설정 토큰
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 페이지 HTML 반환
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<html><body>비밀번호를 재설정하세요</body></html>"
 *       400:
 *         description: 토큰이 없거나 잘못됨
 *       500:
 *         description: 서버 오류
 */
router.get('/reset-password/verify', companysController.resetPasswordTokenVerify)

/**
 * @swagger
 * /companys/new-password:
 *   patch:
 *     summary: 비밀번호 재설정 처리
 *     tags: [Companys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: 이메일을 통해 전달받은 비밀번호 재설정 토큰
 *                 example: "abc123tokenvalue"
 *               password:
 *                 type: string
 *                 description: 새 비밀번호
 *                 example: "newSecurePassword123!"
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공 후 HTML 페이지 반환
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<html><body>비밀번호가 성공적으로 변경되었습니다.</body></html>"
 *       400:
 *         description: 요청 파라미터 오류 또는 유효하지 않은 토큰
 *       500:
 *         description: 서버 내부 오류
 */
router.patch('/new-password', companysController.updateNewPassword)

/**
 * @swagger
 * /companys/recover-id:
 *   post:
 *     summary: 아이디 찾기 이메일 전송
 *     tags: [Companys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: 사용자 이메일
 *                 example: "xowjd8465@naver.com"
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 메일 전송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reset password email sent successfully"
 *       400:
 *         description: 잘못된 요청 또는 존재하지 않는 이메일
 *       500:
 *         description: 서버 오류
 */
router.post('/recover-id', companysController.sendVerificationEmailToUser)

/**
 * @swagger
 * /companys/recover-id/verify:
 *   get:
 *     summary: 이메일 인증 후 사용자 ID 확인
 *     tags: [Companys]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: 이메일 인증 토큰
 *     responses:
 *       200:
 *         description: 인증 성공 시 HTML 반환
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<html><body>인증이 완료되었습니다</body></html>"
 *       400:
 *         description: 토큰 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/recover-id/verify',companysController.getUserIdAfterVerification)

/**
 * @swagger
 * /companys/recruit-jobs:
 *   post:
 *     summary: 채용 공고 등록
 *     tags: [Companys] 
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - deadline
 *             properties:
 *               title:
 *                 type: string
 *                 description: 채용 공고 제목
 *                 example: Recruit Software Engineer
 *               description:
 *                 type: string
 *                 description: 채용 공고 상세 설명
 *                 example: We are hiring a skilled engineer...
 *               category:
 *                 type: string
 *                 description: 채용 공고 분야
 *                 example: 1
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: 지원 마감일 (YYYY-MM-DD)
 *                 example: 2025-12-31
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 공고 이미지 파일 (JPG, PNG, 최대 5MB, optional)
 *     responses:
 *       201:
 *         description: 채용 공고 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 companyId:
 *                   type: string
 *                   description: 채용 공고 등록 기업의 ID
 *                   example: company123
 *                 title:
 *                   type: string
 *                   example: Recruit Software Engineer
 *       400:
 *         description: 잘못된 요청 (필수 필드 누락, 잘못된 형식)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: title, description, category, deadline은 필수입니다.
 *       401:
 *         description: 인증 실패 (유효하지 않은 토큰)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 유효하지 않거나 만료된 토큰입니다.
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 서버 오류가 발생했습니다.
 */
router.post('/recruit-jobs', companyData.any(), companysController.uploadRecruitJob);

/**
 * @swagger
 * /companys/recruit-jobs/{id}:
 *   patch:
 *     summary: 채용 공고 수정
 *     tags: [Companys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *          type: string
 *         description: 수정할 채용 공고의 고유 ID
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 수정할 제목 (optional)
 *                 example: Recruit Senior Software Engineer
 *               description:
 *                 type: string
 *                 description: 수정할 설명 (optional)
 *                 example: Updated job description...
 *               category:
 *                 type: string
 *                 description: 채용 공고 분야 수정 (optional)
 *                 example: 2
 *               deadline:
 *                 type: string
 *                 format: date
 *                 description: 수정할 마감일 (optional, YYYY-MM-DD)
 *                 example: 2026-01-15
 *     responses:
 *       200:
 *         description: 채용 공고 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: Recruit Senior Software Engineer
 *       400:
 *         description: 잘못된 요청 (유효하지 않은 데이터)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 유효한 데이터를 제공해야 합니다.
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 유효하지 않거나 만료된 토큰입니다.
 *       500:
 *         description: 서버 오류
 */
router.patch('/recruit-jobs/:id', companysController.updateRecruitJob);

/**
 * @swagger
 * /companys/recruit-jobs/{id}:
 *   delete:
 *     summary: 채용 공고 삭제
 *     tags: [Companys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 채용 공고의 고유 id
 *         example: 1
 *     responses:
 *       204:
 *         description: 채용 공고 삭제 성공 (콘텐츠 없음)
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 유효하지 않거나 만료된 토큰입니다.
 *       404:
 *         description: 채용 공고를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 채용 공고를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류
 */
router.delete('/recruit-jobs/:id', companysController.deleteRecruitJob);

/**
 * @swagger
 * /companys/applications/{postId}:
 *   get:
 *     summary: 특정 공고(post_id)의 지원자 목록 조회
 *     tags: [Companys]
 *     security:
 *       - bearerAuth: []
 *     parameters:                
 *       - in: path
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 공고(post)의 ID
 *     responses:
 *       200:
 *         description: 지원자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: app123
 *                   post_id:               
 *                     type: string
 *                     example: 14
 *                   applicant_name:
 *                     type: string
 *                     example: 홍길동
 *                   status:
 *                     type: string
 *                     example: pending
 *                   applied_at:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-07-01T10:00:00Z
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 유효하지 않거나 만료된 토큰입니다.
 *       500:
 *         description: 서버 오류
 */
router.get('/applications/:postId', companysController.getApplicantsByPostId);

/**
 * @swagger
 * /companys/applications/{postId}/by-user/{userId}:
 *   get:
 *     summary: 특정 공고에서 특정 지원자의 이력서 조회
 *     tags: [Companys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 공고(post)의 ID
 *         example: 3
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 사용자의 ID
 *         example: 12
 *     responses:
 *       200:
 *         description: 지원서 조회 성공
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 지원자 또는 채용 공고를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/applications/:postId/by-user/:userId', companysController.getApplicationByUserId);

/**
 * @swagger
 * /companys/applications/{postId}/by-user/{userId}/status:
 *   patch:
 *     summary: 지원자 상태 변경
 *     description: postId와 userId에 해당하는 지원자의 상태(status)를 변경합니다.
 *     tags: [Companys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 공고 ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 지원자(user) ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SUBMITTED, IN_REVIEW, ACCEPTED, FAILED]
 *                 example: ACCEPTED
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 지원서를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.patch('/applications/:postId/by-user/:userId/status', companysController.updateApplicationStatus);



/**
 * @swagger
 * /companys/job-postings:
 *   get:
 *     summary: 공고 목록 조회
 *     description: 회사의 모든 모집 공고 리스트를 조회합니다.
 *     tags: [Companys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 공고 목록 조회 성공
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/job-postings', companysController.listJobPostings);
module.exports = router;
