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

exports.patchUserProfileDocs = async ( { userId, files, texts } ) => {

  let docTasks = [];
  let aiTasks  = [];
  let textTasks =[];
  try {
    if (body?.resumeText || body?.selfIntroText || body?.careerDescText) {

      const resumeTask = body?.resumeText? usersLogic.updateUserDocsText(userId, body.resumeText, query.updateResume) : null; 
      if (resumeTask) textTasks.push(resumeTask);
          
      const selfIntroTask = body?.selfIntroText? usersLogic.updateUserDocsText(userId, body.selfIntroText, query.updateSelfIntro) : null; 
      if (selfIntroTask) textTasks.push(selfIntroTask);

      const careerDescTask = body?.careerDescText? usersLogic.updateUserDocsText(userId, body.careerDescText, query.updateCarrerDesc) : null; 
      if (careerDescTask) textTasks.push(careerDescTask);

    }
  
  
  if (files?.length) {
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
    if (texts?.resumeText) {
      textTasks.push(usersLogic.updateUserDocsText(userId, texts.resumeText, query.updateResume));
    }

    if (texts?.selfIntroText) {
      textTasks.push(usersLogic.updateUserDocsText(userId, texts.selfIntroText, query.updateSelfIntro));
    }

    if (texts?.careerDescText) {
      textTasks.push(usersLogic.updateUserDocsText(userId, texts.careerDescText, query.updateCareerDesc));
    }
    const tasks = [...docTasks, ...aiTasks, ...textTasks]; // 평탄화
    await Promise.all(tasks);
  }
  } catch ( error )
  {
    console.log(error)
    throw new Error( error.message )
  }
  
};

exports.myJobApplications = async ( userId ) => {
  const userPk                = ( await db.query( query.getUserPk, [userId] ) ).rows[0].id;
  const getMyJobApplications  = ( await db.query( query.getJobApplications, [userPk] ) ).rows;
  return getMyJobApplications.length ? getMyJobApplications : null;
};

