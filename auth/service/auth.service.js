
const db                      = require('@db');
const queryJson               = require('@query');
const jsonwebtoken            = require('jsonwebtoken');
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

exports.login = async( userId, password ) => {
    try {
        // DB에서 userId값이 있는지 조회
        let queryResult = await db.query( queryJson.login, [ userId ] );
        queryResult     = queryResult.rows[0];

        // 없다면 Error
        if ( queryResult === undefined ) throw new Error('user not found')
        
        // 비밀번호 검증
        if ( queryResult.password === password ) {

            // token 생성 동시 시작 
            const [ accessToken, refreshToken ] = await Promise.all ( [ makeAccessToken(userId), makeRefreshToken(userId) ] );
            const updateDate                    = new Date();

            // db에 token 및 현재 시간 update
            await db.query( queryJson.loginSuccess, [ accessToken, refreshToken, updateDate, userId ] );

            // token return
            return { "access_token : " : accessToken , "refresh_token" : refreshToken };
        }
        else throw new Error('user not found')
        
    } catch ( error ) {
        throw new Error('user not found')
    }
}


const makeSignUpToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.REFRESH_SECRET, { expiresIn: '5m' } );
}
// 이메일 발송 함수
const sendMailForSignUp = async ( email ) => {

    const signUpToken = makeSignUpToken(email)
    const filePath    = path.join(__dirname, 'index.html');
    const mailBody    = fs.readFileSync(filePath, 'utf8');
    mailBody          = mailBody.replace('{TOKEN}',signUpToken);

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

    try {
        const info = await transPorter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info.response;  // 이메일 발송 성공 메시지 반환

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');  // 이메일 발송 실패 시 에러 발생
    }
};
exports.signUp = async ( userData, userFiles ) => {
    try {
        let queryResult = await db.query( queryJson.checkIdDuplicate, [ userData.userId ] );
        queryResult     = queryResult.rows;
        if ( queryResult == [] ) throw new Error('user is duplicate');
        await sendMailForSignUp(userData.email)
       
        
    } catch (error) {
        throw new Error(error)

    }
}


exports.signUpVerify = async() => {

}