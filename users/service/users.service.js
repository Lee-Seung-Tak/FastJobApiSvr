const db           = require('@db');
const queryJson    = require('@query');
const fs           = require('fs');
const path         = require('path');
const multer       = require('multer');
const usersLogic = require('@users_logic');
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

exports.patchUserProfileDocs = async ({ userId, files, uploadDir }) => {
  // 입력 검증
  if (!Array.isArray(files) || files.length === 0) {
    const err = new Error('No files provided');
    err.statusCode = 400;
    throw err;
  }

  const result = {};

  for (const file of files) {
    // 파일 유효성 검사
    if (!file) {
      const err = new Error('Invalid file provided');
      err.statusCode = 400;
      throw err;
    }

    // 1) fieldname에 따른 조회 쿼리·컬럼명·업데이트 쿼리 삼항 연산자
    const [getPrevQuery, columnName] =
      file.fieldname === 'resume'     ? [queryJson.getResumeUrl,     'resume_url']     :
      file.fieldname === 'selfIntro'  ? [queryJson.getSelfIntroUrl,  'self_intro_url'] :
      file.fieldname === 'careerDesc' ? [queryJson.getCareerDescUrl, 'career_desc_url'] :
      /* else */                       (() => { 
        const err = new Error(`Unsupported file field: ${file.fieldname}`);
        err.statusCode = 400; throw err;
      })();
     
    // 2) 이전 URL 조회
    const { rows: prevRows = [] } = await db.query(getPrevQuery, [userId]);
    
    const existingUrl = prevRows[0]?.[columnName] ?? null;

    // 3) 삭제·생성·업데이트 로직 호출
    const newUrl = await usersLogic.updateDocumentUrl({
      userId,
      file,
      uploadDir,
      existingUrl
    });

    // 4) 결과 저장
    result[file.fieldname] = newUrl;
  }

  return result;
};