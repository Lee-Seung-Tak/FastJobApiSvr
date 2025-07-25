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

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: 내 정보 및 보유 기술 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 및 기술 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "홍길동"
 *                     email:
 *                       type: string
 *                       example: "gildong@example.com"
 *                     phone:
 *                       type: string
 *                       example: "010-1234-5678"
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["JavaScript", "Node.js", "React"]
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패 (토큰 없음 또는 유효하지 않음)
 *       500:
 *         description: 서버 오류
 */
router.get('/me', usersController.getUser);

/**
 * @swagger
 * /users/my-job-application:
 *   get:
 *     summary: 로그인한 사용자의 지원 이력 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 지원 이력 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   jobId:
 *                     type: integer
 *                     example: 123
 *                   jobTitle:
 *                     type: string
 *                     example: "백엔드 개발자"
 *                   company:
 *                     type: string
 *                     example: "오픈AI"
 *                   status:
 *                     type: string
 *                     example: "지원 완료"
 *                   appliedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-06-01T12:00:00Z"
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패 (토큰 없음 또는 만료)
 *       500:
 *         description: 서버 오류
 */
router.get('/my-job-application', usersController.myJobApplications);

/**
 * @swagger
 * /users/user/application-docs:
 *   patch:
 *     summary: 유저 프로필 문서 및 텍스트 업데이트
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resumeText:
 *                 type: string
 *                 description: 이력서 텍스트 (nullable)
 *                 example: "경력 5년차 프론트엔드 개발자입니다."
 *                 nullable: true
 *               selfIntroText:
 *                 type: string
 *                 description: 자기소개서 텍스트 (nullable)
 *                 example: "성실하고 끈기 있는 사람입니다."
 *                 nullable: true
 *               careerDescText:
 *                 type: string
 *                 description: 경력 상세 설명 텍스트 (nullable)
 *                 example: "B사에서 리드 개발자로 근무"
 *                 nullable: true
 *               resumeFile:
 *                 type: string
 *                 format: binary
 *                 description: 이력서 파일 (nullable)
 *                 nullable: true
 *               selfIntroFile:
 *                 type: string
 *                 format: binary
 *                 description: 자기소개서 파일 (nullable)
 *                 nullable: true
 *               careerDescFile:
 *                 type: string
 *                 format: binary
 *                 description: 경력 설명 파일 (nullable)
 *                 nullable: true
 *     responses:
 *       200:
 *         description: 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Update Success"
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.patch('/user/application-docs', userData.any(), usersController.patchUserProfileDocs);
// TO Do - 1
// 사용자 이력서 및 자기소개서, 경력 기술서, 포트폴리오 url 업데이트
//router.update('/user')

/**
 * @swagger
 * /users/apply-to-post:
 *   post:
 *     summary: 사용자가 채용 공고에 지원
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobPostingId:
 *                 type: string
 *                 description: 지원할 채용 공고의 ID
 *                 example: "1"
 *     responses:
 *       200:
 *         description: 지원 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Application submitted successfully"
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post('/apply-to-post', usersController.submitApplication);

/**
 * @swagger
 * /users/delete-application:
 *   delete:
 *     summary: 사용자가 채용 공고 지원을 취소
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobPostingId:
 *                 type: string
 *                 description: 취소할 채용 공고의 ID
 *                 example: 123
 *     responses:
 *       200:
 *         description: 지원 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "deleted successfully"
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 지원 내역을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.delete('/delete-application', usersController.deleteApplication);

/**
 * @swagger
 * /users/job-postings:
 *   get:
 *     summary: 공고 목록 조회
 *     description: 회사가 등록한 모든 채용 공고 리스트를 반환합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 공고 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 공고 고유 ID
 *                         example: 101
 *                       company_id:
 *                         type: integer
 *                         description: 회사 고유 ID
 *                         example: 5
 *                       title:
 *                         type: string
 *                         description: 공고 제목
 *                         example: "Senior Backend Developer"
 *                       description:
 *                         type: string
 *                         description: 공고 상세 설명
 *                         example: "Spring Boot 기반 마이크로서비스 설계 및 개발 담당"
 *                       category:
 *                         type: integer
 *                         description: 카테고리 ID
 *                         example: 2
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: 공고 등록 일시
 *                         example: "2025-06-15T10:30:00Z"
 *                       deadline:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: 지원 마감 일시
 *                         example: "2025-08-01T23:59:59Z"
 *                       is_active:
 *                         type: boolean
 *                         description: 공고 활성화 여부
 *                         example: true
 *             example:
 *               postings:
 *                 - id: 101
 *                   company_id: 5
 *                   title: "Senior Backend Developer"
 *                   description: "Spring Boot 기반 마이크로서비스 설계 및 개발 담당"
 *                   category: 2
 *                   created_at: "2025-06-15T10:30:00Z"
 *                   deadline: "2025-08-01T23:59:59Z"
 *                   is_active: true
 *                 - id: 102
 *                   company_id: 7
 *                   title: "Frontend Engineer"
 *                   description: "React와 TypeScript를 활용한 사용자 인터페이스 개발"
 *                   category: 1
 *                   created_at: "2025-06-20T14:00:00Z"
 *                   deadline: "2025-07-31T23:59:59Z"
 *                   is_active: true
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/job-postings', usersController.listJobPostings);
module.exports = router;
