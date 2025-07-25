const nodemailer = require('nodemailer');
const db         = require('@db');
const query      = require('@query');
const dotenv     = require('dotenv');
const fs         = require('fs');
const path       = require('path');
const jwt        = require('jsonwebtoken');

dotenv.config();

//회원가입 토큰 생성 및 검증
exports.makeSignUpToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.SIGNUP_SECRET, { expiresIn: '5m' } );
}

exports.verifySignUpToken = async ( signUpToken ) => {
    return jwt.verify( signUpToken, process.env.SIGNUP_SECRET );
}

//AccessToken 생성
exports.makeAccessToken = async ( companyId ) => {
    return jwt.sign( { companyId : companyId }, process.env.ACCESS_SECRET, { expiresIn: '1h' } );
}

//RefreshToken 생성 및 검증
exports.makeRefreshToken = async ( companyId ) => {
    return jwt.sign( { companyId : companyId }, process.env.REFRESH_SECRET, { expiresIn: '7d' } );
}

exports.verifyRefreshToken = async ( token ) => {
    try {
        const decode = jwt.verify( token, process.env.REFRESH_SECRET );
        return decode.companyId;
    } catch ( error ){
        return null;
    }
}

//비밀번호 초기화 토큰 생성 및 검증
exports.makeResetPwdToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.RESETPASSWORD_SECRET, { expiresIn: '5m' } );
}

exports.verifyResetPwdToken = async ( token ) => {
    try {
        const decode = jwt.verify( token, process.env.RESETPASSWORD_SECRET );
        return decode.email;
    } catch (error){
        console.log(error)
        return null;
    }
}

//비밀번호 재설정 토큰 생성 및 검증
exports.makeChangePwdToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.CHANGEPASSWORD_SECRET, { expiresIn: '15m' } );
}

exports.verifyChangePwdToken = async ( token ) => {
    try {
        const decode = jwt.verify( token, process.env.CHANGEPASSWORD_SECRET );
        return decode.email;
    } catch (error){
        console.log(error)
        return null;
    }
}

//ID 찾기 토큰 생성 및 검증
exports.makeIdVerificationToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.GETID_SECRET, { expiresIn: '5m' } );
}

exports.verifyIdRecoveryToken = async ( token ) => {
    try {
        const decode = jwt.verify( token, process.env.GETID_SECRET );
        return decode.email;
    } catch (error ){
        console.log(error)
        return null;
    }
}

//토큰 생성 및 DB 저장
exports.tokensRefresh = async ( companyId ) => {

    const [ accessToken, refreshToken ] = await Promise.all ( [ this.makeAccessToken(companyId), this.makeRefreshToken(companyId) ] );
    await db.query( query.updateCompanyTokens, [ accessToken, refreshToken, companyId ] );
    return {
        "access_token"  : accessToken,
        "refresh_token" : refreshToken
    }
}

//이메일 발송 함수 
const transPorter = nodemailer.createTransport({
    service:"gmail",
    host: "smtp.gmail.COM",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.SYS_EMAIL,
      pass: process.env.SYS_EMAIL_KEY,
    },
  });

//회원가입 인증 이메일 발송
exports.sendMailForSignUp = async ( email , signUpToken ) => {
    const filePath    = path.join(__dirname, 'index.html');
    let mailBody      = fs.readFileSync(filePath, 'utf8');
    mailBody          = mailBody.replace('{TOKEN}', await signUpToken);

    const mailOptions = {
        from   : process.env.SYS_EMAIL,  
        to     : email,                         
        subject: '[회원가입 인증 메일]',                       
        html   : mailBody                           
    };

    try {
        const info = await transPorter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);

    } catch (error) {
        console.error  ( 'Error sending email:', error );
        await db.query ( query.sendCompanyEmailFalse, [email] );
        throw new Error( 'Failed to send email' );  // 이메일 발송 실패 시 에러 발생
    }
};

//ID 찾기를 위한 이메일 전송
exports.sendMailCheckId = async ( email , getIdToken ) => {
    const filePath      = path.join(__dirname, '/web/getUserByEmail.html');
    let mailBody        = fs.readFileSync(filePath, 'utf8');
    mailBody            = mailBody.replace('{TOKEN}', await getIdToken);

    const mailOptions = {
        from   : process.env.SYS_EMAIL,  
        to     : email,                         
        subject: '[아이디 확인 메일]',                       
        html   : mailBody                           
    };

    try {
        const info = await transPorter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);

    } catch (error) {
        console.error  ( 'Error sending email:', error );
        await db.query ( query.sendEmailFalse, [email] );
        throw new Error( 'Failed to send email' );  // 이메일 발송 실패 시 에러 발생
    }
}

//비밀번호 초기화를 위한 본인인증 이메일 전송
exports.sendMailResetPassword = async ( email , resetPasswordToken ) => {
    const filePath    = path.join(__dirname, '/web/resetPassword.html');
    let mailBody      = fs.readFileSync(filePath, 'utf8');
    mailBody          = mailBody.replace('{TOKEN}', resetPasswordToken);

    const mailOptions = {
        from   : process.env.SYS_EMAIL,  
        to     : email,                         
        subject: '[비밀번호 변경을 위한 본인인증 메일]',                       
        html   : mailBody                           
    };

    try {
        const info = await transPorter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);

    } catch (error) {
        console.error  ( 'Error sending email:', error );
        await db.query ( query.sendCompanyEmailFalse, [email] );
        throw new Error( 'Failed to send email' );  // 이메일 발송 실패 시 에러 발생
    }
}

//비밀번호 업데이트
exports.updatePassword = async (email, newPassword) => {
    try {
        await db.query(query.updateCompanyPwd,[newPassword, email]);
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        return false;
    }
}

exports.insertCompanyData = async ( companyData, signUpToken ) => {
    const userRole = 1; //PENDING
    try {
        await db.query( query.insertCompanySignupData , [
            companyData.name,
            companyData.email,
            companyData.phone,
            companyData.address,
            companyData.companyId,
            companyData.password,
            companyData.business,
            userRole, 
            signUpToken,
        ]);
         
    } catch ( error ) {
        return error
    }
   
}

//채용공고 등록
exports.uploadRecruitJob = async ( companyData ) => {
    try {
        console.log(companyData)
        const idPk = await exports.getId( companyData.companyId );
                
        await db.query ( query.uploadRecruitJob , [
            idPk,
            companyData.title,
            companyData.description,
            companyData.category,
            companyData.deadline,
            companyData.is_active 
        ]);
    } catch ( error ) {
        throw error;
    }
}

//companyId로 id(PK) 가져오기
exports.getId = async ( companyId ) => {
    try {
        
        const getIdResult = await db.query( query.getId, [ companyId ] );
        const idPk = getIdResult.rows[0].id;
        return idPk;
    } catch ( error ) {
        throw error;
    }
}


//채용공고 수정
exports.updateRecruitJob = async ( id, data ) => {
    try {
    // 수정할 데이터만 필터링
    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.deadline) updateData.deadline = data.deadline;

    // 데이터베이스 업데이트
    const updatedJob = await db.query ( query.updateRecruitJob, [id, data] );

    return updatedJob;
  } catch (error) {
    throw error;
  }
}

exports.getApplicantsByPostId = async ( postId ) => {
  try {
    const { rows } = await db.query( query.getApplicantsByPostId, [ postId ] );
    return rows;

  } catch ( error ) {
    console.error('지원자 목록 조회 오류:', error);
    throw error;
  }
}

exports.getApplicationByUserId = async ( postId, userId ) => {
  try {
    await db.query( query.changeStatus, [ postId, userId ]);

    const { rows } = await db.query( query.getApplicantsByUserId, [ postId, userId ]);
    return rows[0];

  } catch (error) {
    console.error('특정 공고 지원자 조회 오류:', error);
    throw new Error('Database query error');
  }
}

exports.updateApplicationStatus = async ( postId, userId, statusCode ) => {
    try {
        await db.query( query.updateUserApplicationStatus, [ userId, statusCode ]);

        const { rows } = await db.query( query.updateApplicationStatus, [ postId, userId, statusCode ]); 
        return rows[0];

    } catch (error) {
        console.error('공고 지원자 상태 변경 오류:', error);
        throw error;
    }
}

