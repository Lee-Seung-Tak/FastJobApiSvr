const db         = require('@db');
const query      = require('@query');
const usersLogic = require('@users_logic');
const path       = require('path');
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
    const result = await db.query( query.patchPhoneNumber, [phone, patchUserData.userId] );
    console.log('updatePhone rowCount:', result.rowCount);
  }

  if ( oldPassword || newPassword || confirmPassword ) {

    // lst add / login -> getUserPassword라는 신규 쿼리 추가
    let queryResult = await db.query( query.getUserPassword, [patchUserData.userId] );
    queryResult     = queryResult.rows[0].password;
    
    if (!queryResult || queryResult !== oldPassword) {
      const err = new Error('Old password is incorrect'); err.statusCode = 401; 
      throw err;
    }
    
    await db.query( query.patchPassword, [newPassword, patchUserData.userId] );
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
    let queryResult = await db.query( query.getUserById, [userId] );
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
  const { rows } = await db.query( query.getUserData, [userId] );
  return rows.length ? rows[0] : null;
};

exports.patchUserProfileDocs = async ({ userId, files }) => {

  try {
    const uploadDir = path.resolve(__dirname, '../../uploads');

    for (const file of files) {

      const getUpdateQuery =
        file.fieldname === 'resumeFile'     ? query.updateResumeUrl     :
        file.fieldname === 'selfIntroFile'  ? query.updateSelfIntroUrl  :
        file.fieldname === 'careerDescFile' ? query.updateCareerDescUrl : null;
        
      if ( getUpdateQuery )
        updateUserDocsResult = usersLogic.updateUserDocsUrl( userId, file.filename, getUpdateQuery);

      /*
      * 여기에 file이 아닌 LLM(AI)가 정리한 내용을 직접 수정하는 로직을 넣으시면 됩니다.
      */
      if ( updateUserDocsResult )
        await updateUserDocsResult;

    }

  } catch ( error )
  {
    throw new Error( error.message )
  }
  
};