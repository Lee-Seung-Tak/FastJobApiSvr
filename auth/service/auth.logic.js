
const db                      = require('@db');
const query                   = require('@query');
const { PG_UNIQUE_VIOLATION } = require('postgres-error-codes');
const dotenv                  = require('dotenv')
const fs                      = require('fs');
const path                    = require('path');
const nodemailer              = require('nodemailer');
dotenv.config();
const jwt = require('jsonwebtoken');

const makeAccessToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.ACCESS_SECRET, { expiresIn: '1h' } );
}
const makeRefreshToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' } );
}


// 이메일 발송 함수 
const transPorter = nodemailer.createTransport({
    service:"gmail",
    host: "smtp.gmail.email",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.SYS_EMAIL,
      pass: process.env.SYS_EMAIL_KEY,
    },
  });

const mailOptions = {
    from   : process.env.SYS_EMAIL,  
    to     : email,                         
    subject: '[회원가입 인증 메일]',                       
    html   : mailBody                           
};

const sendMailForSignUp = async ( email , signUpToken ) => {

    const filePath    = path.join(__dirname, 'index.html');
    const mailBody    = fs.readFileSync(filePath, 'utf8');
    mailBody          = mailBody.replace('{TOKEN}',signUpToken);

    try {
        const info = await transPorter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info.response;  // 이메일 발송 성공 메시지 반환

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');  // 이메일 발송 실패 시 에러 발생
    }
};

const insertUserData = async ( userData, userFiles, signUpToken ) => {
    const userRole = 1; //PENDING
    await db.query( query.insertSignupData , [
        userData.name,
        userData,email,
        userData.phone,
        userData.userId,
        userData.category,
        signUpToken,
        userRole,
        userFiles.resume,
        userFiles.resumeUrl,
        userFiles.selfIntro,
        userFiles.selfIntro_url,
        userFiles.carrerDesc,
        userFiles.careerDescUrl,
        userFiles.portpolioUrl,   
    ]);
}

const makeSignUpToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.SIGNUP_SECRET, { expiresIn: '5m' } );
}