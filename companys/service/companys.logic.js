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
exports.makeAccessToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.ACCESS_SECRET, { expiresIn: '1h' } );
}

//RefreshToken 생성 및 검증
exports.makeRefreshToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' } );
}

exports.verifyRefreshToken = async ( token ) => {
    try {
        const decode = jwt.verify( token, process.env.REFRESH_SECRET );
        return decode.userId;
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

//아이디 찾기 토큰 생성 및 검증
exports.makeFindIdToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.GETID_SECRET, { expiresIn: '5m' } );
}

exports.verifyFindIdToken = async ( GETID_SECRET ) => {
    try {
        const decode = jwt.verify( GETID_SECRET, process.env.GETID_SECRET );
        return decode.email;
    } catch (error ){
        console.log(error)
        return null;
    }
}

//토큰 생성 및 DB 저장
exports.tokensRefresh = async ( userId ) => {

    const [ accessToken, refreshToken ] = await Promise.all ( [ this.makeAccessToken(userId), this.makeRefreshToken(userId) ] );
    await db.query( query.updateCompanyTokens, [ accessToken, refreshToken, userId ] );
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

exports.insertCompanyData = async ( userData, signUpToken ) => {
    const userRole = 1; //PENDING
    try {
        await db.query( query.insertCompanySignupData , [
            userData.name,
            userData.email,
            userData.phone,
            userData.address,
            userData.userId,
            userData.password,
            userData.business,
            userRole, 
            signUpToken,
        ]);
         
    } catch ( error ) {
        return error
    }
   
}