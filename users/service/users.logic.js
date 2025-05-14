const db        = require('@db');
const queryJson = require('@query');
const fs        = require('fs');
const path      = require('path');

/**
 * 기존 파일 삭제 → 새 URL 생성 → DB 업데이트
 */
exports.updateUserDocsUrl = async ( userId, fileName, updateQuery ) => {
  const newUrl = `/uploads/${fileName}`;
  await db.query( updateQuery, [ newUrl, userId ] );
};

exports.updateUserDocsText = async ( userId, text, updateQuery ) => {
  try {
   
    await db.query( updateQuery, [ text, userId ] );
  } catch (err) {
    console.error('[DB] Text update error:', err);
    throw new Error('텍스트 업데이트 중 오류 발생');
  }
};