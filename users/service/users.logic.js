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
  await db.query( updateQuery, [ text, userId ] );
};