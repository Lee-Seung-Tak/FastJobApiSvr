
const db                      = require('@db');
const queryJson               = require('@query');
const jsonwebtoken            = require('jsonwebtoken');
const { PG_UNIQUE_VIOLATION } = require('postgres-error-codes');
const dotenv                  = require('dotenv')
const nodemailer              = require('nodemailer');
dotenv.config();


const jwt = require('jsonwebtoken');
const makeAccessToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.ACCESS_SECRET, { expiresIn: '1h' } );
}
const makeRefreshToken = async ( userId ) => {
    return jwt.sign( { userId : userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' } );
}


const transPorter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS   
    }
});

// 이메일 발송 함수
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // 보내는 이메일 주소
        to,                            // 받는 이메일 주소
        subject,                       // 메일 제목
        text                           // 메일 내용
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
        
    } catch ( error ) {
        throw new Error('user not found')
    }
}

exports.signUp = async ( userData ) => {
    
}