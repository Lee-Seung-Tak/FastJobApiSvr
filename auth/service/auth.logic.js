
const db                      = require('@db');
const query                   = require('@query');
const dotenv                  = require('dotenv')
const fs                      = require('fs');
const path                    = require('path');
const nodemailer              = require('nodemailer');
const analyze                 = require('@ai_analyze');
dotenv.config();
const jwt = require('jsonwebtoken');

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

exports.tokensRefresh = async ( userId ) => {
    
    const [ accessToken, refreshToken ] = await Promise.all ( [ this.makeAccessToken(userId), this.makeRefreshToken(userId) ] );
    await db.query( query.updateUserTokens, [ accessToken, refreshToken, userId ] );
    return {
        "access_token"  : accessToken,
        "refresh_token" : refreshToken
    }
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
        await db.query ( query.sendEmailFalse, [email] );
        throw new Error( 'Failed to send email' );  // 이메일 발송 실패 시 에러 발생
    }
};

exports.sendAnalyzeDoneEmail = async ( email ) => {
    const filePath    = path.join(__dirname, 'analyze.html');
    let mailBody      = fs.readFileSync(filePath, 'utf8');

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
        await db.query ( query.sendEmailFalse, [email] );
        throw new Error( 'Failed to send email' );  // 이메일 발송 실패 시 에러 발생
    }
};

exports.sendAnalyzeErrorEmail = async () => {
    const filePath    = path.join(__dirname, 'analyze_error.html');
    let mailBody      = fs.readFileSync(filePath, 'utf8');

    const mailOptions = {
        from   : process.env.SYS_EMAIL,  
        to     : 'lstlove9804@naver.com',                         
        subject: '[회원가입 인증 메일]',                       
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
};

exports.insertUserData = async ( userData, signUpToken ) => {
    const userRole = 1; //PENDING
    try {
        await db.query( query.insertSignupData , [
            userData.name,
            userData.email,
            userData.phone,
            userData.userId,
            userData.password,
            userData.category,
            signUpToken,
            userRole,
            userData.resume,
            userData.resumeUrl,
            userData.selfIntro,
            userData.selfIntro_url,
            userData.carrerDesc,
            userData.careerDescUrl,
            userData.portpolioUrl,   
        ]);
        const getUserPk = await db.query( query.getUserPk, [ userData.userId ] )
        const userPk    = getUserPk.rows[0].id;
        return userPk;
        
    } catch ( error ) {
        return error
    }
   
}

exports.makeSignUpToken = async ( email ) => {
    return jwt.sign( { email : email }, process.env.SIGNUP_SECRET, { expiresIn: '5m' } );
}

exports.userDataAnalyze = async ( userData ) => {

    try {
        let analyzeResumeResult, analyzeSelfIntroResult, analyzeCarrerDescResult;
        if (userData.resume)     analyzeResumeResult     = analyze.aiAnalyzeResume     ( userData.userId, userData.resumeUrl     );
        if (userData.selfIntro)  analyzeSelfIntroResult  = analyze.aiAnalyzeSelfIntro  ( userData.userId, userData.selfIntroUrl  );
        if (userData.carrerDesc) analyzeCarrerDescResult = analyze.aiAnalyzeCarrerDesc ( userData.userId, userData.carrerDescUrl );
        
        if ( analyzeResumeResult     ) await analyzeResumeResult;
        if ( analyzeSelfIntroResult  ) await analyzeSelfIntroResult;
        if ( analyzeCarrerDescResult ) await analyzeCarrerDescResult;

        await this.sendAnalyzeDoneEmail( userData.email );

    } catch ( error ) {
        // Error인 경우 관리자 이메일
        await this.sendAnalyzeErrorEmail();
    }
}

exports.insertUserSkill = async ( userPk, skillId ) => {
    await db.query( query.insertUserSkill, [ userPk, skillId ] );
};