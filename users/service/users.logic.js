const db        = require('@db');
const queryJson = require('@query');
const fs        = require('fs');
const path      = require('path');

/**
 * 기존 파일 삭제 → 새 URL 생성 → DB 업데이트
 */
exports.updateDocumentUrl = async ({ userId, file, uploadDir, existingUrl }) => {
  // 1) 새 URL 생성
  const newUrl = `/uploads/${file.filename}`;

  // 2) 이전 파일이 있고, 새 URL과 다를 때만 삭제
  if (existingUrl && existingUrl !== newUrl) {
    const oldPath = path.join(uploadDir, path.basename(existingUrl));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // 3) fieldname별 UPDATE 쿼리 선택
  const updateQuery =
    file.fieldname === 'resume'     ? queryJson.updateResumeUrl     :
    file.fieldname === 'selfIntro'  ? queryJson.updateSelfIntroUrl  :
    file.fieldname === 'careerDesc' ? queryJson.updateCareerDescUrl :
    /* else */ (() => {
      const err = new Error(`Unsupported file field: ${file.fieldname}`);
      err.statusCode = 400; throw err;
    })();

  // 4) DB 업데이트
  const { rows } = await db.query(updateQuery, [userId, newUrl]);
  if (!rows.length) {
    const err = new Error('User not found');
    err.statusCode = 404; throw err;
  }

  return newUrl;
};