

const db           = require('@db');
const serviceLogic = require('@auth_logic');
const query        = require('@query');
const fs           = require('fs')
const path         = require('path');
const PENDING      = 1;
const NORMAL       = 2;
const EMAIL_FAILE  = 3;

exports.login = async( userId, password ) => {
    try {
        // DB에서 userId값이 있는지 조회
        let queryResult = await db.query( query.login, [ userId ] );
        queryResult     = queryResult.rows[0];

        // 없다면 Error
        if ( queryResult === undefined   ) throw new Error('user not found')
        
        if ( queryResult.role !== NORMAL ) throw new Error('user not found')

        
        // 비밀번호 검증
        if ( queryResult.password === password ) {

            // token 생성 동시 시작 
            const [ accessToken, refreshToken ] = await Promise.all ( [ serviceLogic.makeAccessToken(userId), serviceLogic.makeRefreshToken(userId) ] );
            const updateDate                    = new Date();

            // db에 token 및 현재 시간 update
            await db.query( query.loginSuccess, [ accessToken, refreshToken, updateDate, userId ] );

            // token return
            return { "access_token" : accessToken , "refresh_token" : refreshToken };
        }
        else throw new Error('user not found')
        
    } catch ( error ) {
        throw new Error('user not found')
    }
}


exports.signUp = async ( userData ) => {

    try {
        // lst add / 비동기로 llm을 활용한 문서 요약 함수 실행
        serviceLogic.userDataAnalyze( userData );
        let queryResult = db.query( query.checkIdDuplicate, [userData.userId] );
        queryResult     = queryResult.rows;
        if ( queryResult == [] ) throw new Error('user is duplicate');

        const signUpToken    = serviceLogic.makeSignUpToken  ( userData.email );
        const userPk         = await serviceLogic.insertUserData( userData, await signUpToken );        
        
        const skillsArr      = userData.skills.split(',');
        const tasks          = [];
        for(skillId of skillsArr) {
            
            if( skillId ) tasks.push( serviceLogic.insertUserSkill(userPk, skillId) );
        }
        if (userPk)
            serviceLogic.sendMailForSignUp( userData.email, signUpToken );
        
        
        else throw new Error(insertStatus)
        await Promise.all( tasks );
    } catch (error) {
        throw new Error(error.message)
    }
}

exports.signUpVerify = async( signUpToken ) => {
    try {
        const decode    = await serviceLogic.verifySignUpToken( signUpToken );
        let queryResult = await db.query ( query.checkSignUpToken, [decode.email] );
        queryResult     = queryResult.rows[0].access_token;

        if ( signUpToken === queryResult )
        {
            await db.query ( query.signupSuccess, [decode.email] );
            return true;

        } else return false;

    } catch ( error ) {
        console.log(error)
        return false;
    }
}

exports.tokenRefresh = async( token ) => {
    try {
        const userId = await serviceLogic.verifyRefreshToken( token );
        if( userId ) return await serviceLogic.tokensRefresh( userId );
    } catch ( error ) {
        console.log("error : ", error.message)
        throw new Error(error);
    }
}

exports.resetPassword = async ( userEmail ) => {
    try {
        const userStatus         = (await db.query( query.IsUserValid, [ userEmail ] )).rowCount;
        const resetPasswordToken = await serviceLogic.makeResetPasswordToken( userEmail );

        await db.query( query.updateToken, [ resetPasswordToken, userEmail ] );

        if ( userStatus == 1 ) await serviceLogic.sendMailResetPassword( userEmail, resetPasswordToken );
        else return false;

        return true
    } catch ( error ) {
        console.log(error)
    }
}

exports.resetPasswordTokenVerify = async ( resetPasswordTokenVerify ) => {
    try {
        const userEmail = await serviceLogic.verifyResetPasswordToken( resetPasswordTokenVerify );

        if ( userEmail != null ) {
            await db.query( query.updateTokenIsNull, [ userEmail ] );
           
            const filePath           = path.join(__dirname, '/web/setNewPassword.html');
            const html               = fs.readFileSync(filePath, 'utf8');
            const resetPasswordToken = await serviceLogic.makeResetPasswordToken( userEmail )
            const updatedHtml        = html.replace('{TOKEN}', resetPasswordToken );

            await db.query( query.updateToken, [ resetPasswordToken, userEmail ] );
            return updatedHtml
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/resetPasswordError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error )
    {
        console.log(error)
    }
}

exports.updateNewPassword = async ( updateToken, newPassword ) => {
    try {
        const userEmail = await serviceLogic.verifyResetPasswordToken( updateToken );
  
        if ( userEmail != null ) {
     
            const filePath           = path.join(__dirname, '/web/resetPasswordSuccess.html');
            const html               = fs.readFileSync(filePath, 'utf8');;
            
            await db.query( query.updateTokenIsNull,   [ userEmail              ] );
            await db.query( query.updateUserPassworkd, [ newPassword, userEmail ] );
            return html
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/resetPasswordError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error ) {
        console.error('updateNewPassword error:', error);
    }
}

exports.sendVerificationEmailToUser = async ( userEmail ) => {
    try {    
        const userStatus         = (await db.query( query.IsUserValid, [ userEmail ] )).rowCount;
        const getIdToken         = await serviceLogic.makeIdVerificationToken( userEmail );
        await db.query( query.updateIdToken, [ getIdToken, userEmail ] );

        if ( userStatus == 1 ) await serviceLogic.sendMailCheckId( userEmail, getIdToken );
        else return false;

        return { message: "Email sent successfully" };
    } catch ( error ) {
        console.log(error)
    }
}

exports.getUserIdAfterVerification = async ( checkToken ) => {
    try {
        const userEmail = await serviceLogic.verifyIdRecoveryToken( checkToken );
  
        if ( userEmail != null ) {
     
            await db.query( query.updateIdFindTokenIsNull, [ userEmail ] );
           
            const filePath           = path.join(__dirname, '/web/confirmId.html');
            const html               = fs.readFileSync(filePath, 'utf8');
            const getUser            = await db.query(query.findUserId, [ userEmail ] );
            const userId             = getUser.rows[0]?.user_id
            const updatedHtml        = html.replace('{USER_ID}', userId.toString());
            
            return updatedHtml
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/confirmIdError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error ) {
        console.error(error)       
    }
}