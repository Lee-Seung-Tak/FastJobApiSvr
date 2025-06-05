const express            = require('express');
const router             = express.Router();
const skillsController   = require('@skills_controller');



/**
 * @swagger
 * /skills/list:
 *   get:
 *     summary: 전체 기술 목록 조회
 *     tags: [Skills]
 *     responses:
 *       200:
 *         description: 모든 기술 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["JavaScript", "Node.js", "React", "Python"]
 *       500:
 *         description: 서버 오류 - 기술 목록 조회 실패
 */
router.get('/list', skillsController.getAllSkills);
module.exports = router;


//router.patch('/skills');
