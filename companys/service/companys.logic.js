const nodemailer = require('nodemailer');
const db         = require('@db');
const query      = require('@query');
const dotenv     = require('dotenv');
const fs         = require('fs');
const path       = require('path');
const jwt        = require('jsonwebtoken');

dotenv.config();

exports.makeSignUpToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.SIGNUP_SECRET, { expiresIn: '5m' } );
}
exports.makeAccessToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.ACCESS_SECRET, { expiresIn: '1h' } );
}
exports.makeRefreshToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' } );
}
exports.verifySignUpToken = async ( signUpToken ) => {
    return jwt.verify( signUpToken, process.env.SIGNUP_SECRET );
}
exports.verifyRefreshToken = async ( token ) => {
    try {
        const decode = jwt.verify( token, process.env.REFRESH_SECRET );
        return decode.userId;
    } catch (error ){
        return null;
    }
}

exports.insertUserData = async ( userData, signUpToken ) => {
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
