const db         = require('@db');
const query      = require('@query');
const usersLogic = require('@users_logic');
const path       = require('path');
const ai         = require('@ai_analyze');

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

exports.getUserSkillsByUserId = async ( userId ) => {
  const result = await db.query( query.getSkillsByUserId, [userId] );
  return result.rows;
};


exports.getUser = async ( userId ) => {
  const { rows } = await db.query( query.getUserData, [userId] );
  return rows.length ? rows[0] : null;
};

exports.patchUserProfileDocs = async ( { userId, files } ) => {

  let docTasks = [];
  let aiTasks  = [];
  try {
    for (const file of files) {
      const docTask =
        file.fieldname === 'resumeFile'     ? usersLogic.updateUserDocsUrl(userId, file.filename, query.updateResumeUrl)     :
        file.fieldname === 'selfIntroFile'  ? usersLogic.updateUserDocsUrl(userId, file.filename, query.updateSelfIntroUrl)  :
        file.fieldname === 'careerDescFile' ? usersLogic.updateUserDocsUrl(userId, file.filename, query.updateCareerDescUrl) :
        null;
  
      const aiTask =
        file.fieldname === 'resumeFile'     ? ai.aiAnalyzeResume(userId, file.path)     :
        file.fieldname === 'selfIntroFile'  ? ai.aiAnalyzeSelfIntro(userId, file.path)  :
        file.fieldname === 'careerDescFile' ? ai.aiAnalyzeCarrerDesc(userId, file.path) :
        null;
    
      if (docTask) docTasks.push(docTask);
      if (aiTask)  aiTasks.push(aiTask);

    }

    const tasks = [...docTasks, ...aiTasks]; // 평탄화
    await Promise.all(tasks);

  } catch ( error )
  {
    console.log(error)
    throw new Error( error.message )
  }
  
};

