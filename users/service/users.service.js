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

// 이 함수를 resumeurl만을 위한 함수가 아니라 모두 받을 수 있게 하면 좋겠다는거에요.
// 그래서 multer에서도 files로 넘겨 받는거고
// 그리고 우리는 파일을 딱 3개만 받을거잖아요.
// 파일네임으로 받아야겠지요.
exports.patchUserProfileDocs = async ({ userId, files, uploadDir }) => {

  for (const file of files) {
    if (!file) {
      const err = new Error('No resume file provided');
      err.statusCode = 400;
      throw err;
    }
    // 2) DB에서 기존 resume_url 조회
    // 지금 이렇게 하면 기존 로직이 다 돌기는 할텐데
    // 여기서 보이는 아 맞다 이것도 말하려고 했는데 queryJson -> query로 변경하세요. 이제 json아닙니다.
    // 이거 조건이 좀 어렵네요 그쵸
    // 얘를들어 file name 별로 json 하는게 좋겠네요.
    // const query =
    //   file.filename === 'resume'
    //     ? queryJson.getResumeUrl
    //     : file.filename === 'selfIntro'
    //     ? queryJson.getSelfIntroUrl
    //     : file.filename === 'carrerDesc'
    //     ? queryJson.getCareerDescUrl
    //     : null;

    // let prev = query ? await db.query(query, [userId]) : null;

    // 훨씬 깔끔하죠??
    
    const getPrevQuery =
    file.fieldname === 'resume'     ? queryJson.getResumeUrl     :
    file.fieldname === 'selfIntro'  ? queryJson.getSelfIntroUrl  :
    file.fieldname === 'careerDesc' ? queryJson.getCareerDescUrl :
    /* else */                       null;
    if(!getPrevQuery) {
      return resumeUrl.statusCode(400),json({ message: '필드가 존재하지 않습니다.' })
    }
    // 그리고 위에 if를 3항으로 하면 더 깔금하겠죠
    const { rows: prevRows = [] } = await db.query(getPrevQuery, [userId]);
    const existingUrl = prevRows[0]?.resume_url ?? null;;
  
    

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
  }
 
};
