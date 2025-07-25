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

exports.getUser = async ( userId ) => {
  
  if ( !userId ) {
    const err = new Error('user Id is required');
    err.statusCode = 400;
    throw err;
  }
    // DB에서 유저 조회
    let queryResult = await db.query( queryJson.getUserById, [userId] );
    queryResult = queryResult.row[0];

    if (!queryResult) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    
    // 비밀번호 정보는 제외하고 반환
    const { password, ...userInfo } = user;
    return userInfo;
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
    if (texts?.resumeText || texts?.selfIntroText || texts?.careerDescText) {

      const resumeTask = texts?.resumeText? usersLogic.updateUserDocsText(userId, texts.resumeText, query.updateResume) : null; 
      if (resumeTask) textTasks.push(resumeTask);
          
      const selfIntroTask = texts?.selfIntroText? usersLogic.updateUserDocsText(userId, texts.selfIntroText, query.updateSelfIntro) : null; 
      if (selfIntroTask) textTasks.push(selfIntroTask);

      const careerDescTask = texts?.careerDescText? usersLogic.updateUserDocsText(userId, texts.careerDescText, query.updateCareerDesc) : null; 
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

exports.submitApplication = async ( userId, jobPostingId ) => {
  try {
    const userPk            = ( await db.query( query.getUserPk, [userId] ) ).rows[0].id;
    const duplicateResult   = await db.query( query.duplicateApplication, [userPk, jobPostingId] )
    
    if (duplicateResult.rows.length > 0) {
      throw new Error ("You have already applied for this job")
    }
    const queryResult       = await db.query( query.insertUserApplications, [userPk, jobPostingId] );
    const deletedId         = queryResult.rows[0].id;
    await db.query( query.insertJobApplication, [ userPk, deletedId ] );
  
  } catch ( error ) {
    console.log( error );
    throw err;
  }
};

exports.deleteApplication = async ( userId, jobPostingId ) => {
  try {
    const userPk                   = ( await db.query( query.getUserPk, [userId] ) ).rows[0].id;
    const deleteJobApplication     = await db.query( query.deleteJobApplication, [userPk, jobPostingId]);
    if ( deleteJobApplication.rowCount === 0 ) {
      throw new Error('No application record found to delete.');
    }
    await db.query( query.deleteApplicationById, [jobPostingId]);
  } catch ( error ) {
    console.log( error );
    throw error;
  }
};

exports.listJobPostings = async () => {
  const result = await db.query(query.getActiveRecruitPosts);
  return result.rows;
};