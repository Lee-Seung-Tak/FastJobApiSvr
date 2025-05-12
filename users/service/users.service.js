const db           = require('@db');
const queryJson    = require('@query');
const fs           = require('fs');
const path         = require('path');
const multer       = require('multer');
require('dotenv').config();


// 통합 유저 정보 수정 (비밀번호·전화·주소)
exports.patchUser = async ( patchUserData ) => {

  const { oldPassword, newPassword, confirmPassword, phone } = patchUserData.body;

  // lst add / password 유무 및, newPassword와 confirmPassword 조건에 따른 에러 리턴이면
  // 전개 연산 이후에 바로 진행하는게 효율적
  if ( !newPassword || newPassword !== confirmPassword ) {
    const err = new Error('New passwords do not match'); err.statusCode = 400; 
    throw err;
  }

  if ( phone ) {
    const result = await db.query( queryJson.patchPhoneNumber, [phone, patchUserData.userId] );
    console.log('updatePhone rowCount:', result.rowCount);
  }

  if ( oldPassword || newPassword || confirmPassword ) {

    // lst add / login -> getUserPassword라는 신규 쿼리 추가
    let queryResult = await db.query( queryJson.getUserPassword, [patchUserData.userId] );
    queryResult     = queryResult.rows[0].password;
    
    if (!queryResult || queryResult !== oldPassword) {
      const err = new Error('Old password is incorrect'); err.statusCode = 401; 
      throw err;
    }
    
    await db.query( queryJson.patchPassword, [newPassword, patchUserData.userId] );
  }

  return { message: 'User information updated successfully' };
};

exports.getUser = async ( userId ) => {
  
  if ( !userId ) {
    const err = new Error('user Id is required');
    err.statusCode = 400;
    throw err;
  }
    // DB에서 유저 조회회
    let queryResult = await db.query( queryJson.getUserById, [userId] );
    queryResult = queryResult.row[0];

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    // 비밀번호 정보는 제외하고 반환환
    const { password, ...userInfo } = user;
    return userInfo;
};

exports.getUserInfo = async( userId ) => {
  const { rows } = await db.query( queryJson.getUserData, [userId] );
  return rows.length ? rows[0] : null;
};

exports.patchResumeUrl = async ({ userId, file, uploadDir }) => {
  // 1) 업로드된 파일이 없으면 400 에러
  if (!file) {
    const err = new Error('No resume file provided');
    err.statusCode = 400;
    throw err;
  }
  // 2) DB에서 기존 resume_url 조회
  const prev = await db.query( queryJson.getResumeUrl, [userId] );
  const existingUrl = prev.rows[0]?.resume_url;

  // 3) 기존 파일이 있으면 파일 시스템에서 삭제
  if (existingUrl) {
    const oldPath = path.join(uploadDir, path.basename(existingUrl));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // 4) 새 URL 생성
  const resumeUrl = `/uploads/${file.filename}`;

  // 5) DB 업데이트
  const { rows } = await db.query(queryJson.updateResumeUrl, [userId, resumeUrl]);
  if (!rows.length) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  // 6) 업데이트된 URL 객체 반환
  return rows[0];
};
