const db            = require('@db');
const companysLogic = require('@companys_logic');
const query         = require('@query');
const fs           = require('fs')
const path         = require('path');
const PENDING       = 1;
const NORMAL        = 2;
const EMAIL_FAILE   = 3;



exports.signUp = async ( userData ) => {
    try {
      const queryResult = await db.query( query.checkCompanyIdDuplicate, [ userData.userId ] );
      if (queryResult.rows.length > 0) throw new Error('user is duplicate');
  
      const signUpToken = await companysLogic.makeSignUpToken( userData.email );

      await companysLogic.insertUserData( userData, signUpToken );
      await companysLogic.sendMailForSignUp( userData.email, signUpToken );
      return { message: 'Signup successful. Please verify your email.' };
      
    } catch (error) {
      throw new Error( error.message );
    }
  };

exports.signUpVerify = async( signUpToken ) => {
    try {
        const decode    = await companysLogic.verifySignUpToken( signUpToken );
        let queryResult = await db.query ( query.checkCompanySignUpToken, [decode.email] );
        queryResult     = queryResult.rows[0].access_token;

        if ( signUpToken === queryResult )
        {
            await db.query ( query.companySignupSuccess, [decode.email] );
            return true;

        } else return false;

    } catch ( error ) {
        console.log(error)
        return false;
    }
}

exports.login = async( userId, password ) => {
    try {
        // DB에서 userId값이 있는지 조회
        let queryResult = await db.query( query.companyLogin, [ userId ] );
        queryResult     = queryResult.rows[0];

        // 없다면 Error
        if ( queryResult === undefined   ) throw new Error('user not found')
        
        if ( queryResult.role !== NORMAL ) throw new Error('user not found')

        
        // 비밀번호 검증
        if ( queryResult.password === password ) {

            // token 생성 동시 시작 
            const [ accessToken, refreshToken ] = await Promise.all ( [ companysLogic.makeAccessToken(userId), companysLogic.makeRefreshToken(userId) ] );
            const updateDate                    = new Date();

            // db에 token 및 현재 시간 update
            await db.query( query.companyLoginSuccess, [ accessToken, refreshToken, updateDate, userId ] );

            // token return
            return { "access_token" : accessToken , "refresh_token" : refreshToken };
        }
        else throw new Error('user not found')
        
    } catch ( error ) {
        throw new Error('user not found')
    }
}

exports.tokenRefresh = async( token ) => {
    try {
        const userId = await companysLogic.verifyRefreshToken( token );
        if( userId ) return await companysLogic.tokensRefresh( userId );
    } catch ( error ) {
        console.log("error : ", error.message)
        throw new Error(error);
    }
}

//비밀번호 초기화 및 검증
exports.resetPwd = async ( userEmail ) => {
    try {
        const CompanyStatus         = (await db.query( query.IsUserValid, [ userEmail ] )).rowCount;
        const resetPasswordToken = await companysLogic.makeResetPwdToken( userEmail );

        await db.query( query.updateResetCompanyPwdToken, [ resetPasswordToken, userEmail ] );

        if ( CompanyStatus == 1 ) await companysLogic.sendMailResetPassword( userEmail, resetPasswordToken );
        else return false;

        return true
    } catch ( error ) {
    console.error( 'Password reset request error:', error.message );
    throw error;
    }
}

exports.resetPwdTokenVerify = async ( resetPasswordToken ) => {
    try {
        const userEmail = await companysLogic.verifyResetPwdToken( resetPasswordToken );

        if ( userEmail != null ) {
            await db.query( query.updateResetCompanyPwdTokenIsNull, [ userEmail ] );
           
            const filePath            = path.join(__dirname, '/web/setNewPassword.html');
            const html                = fs.readFileSync(filePath, 'utf8');
            const changePasswordToken = await companysLogic.makeChangePwdToken( userEmail ) 
            const updatedHtml         = html.replace('{TOKEN}', changePasswordToken );

            await db.query( query.updateChangeCompanyPwdToken, [ changePasswordToken, userEmail ] );
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

//비밀번호 재설정
exports.updateNewPwd = async ( changePasswordToken, newPassword ) => {
    try {
        const userEmail = await companysLogic.verifyChangePwdToken( changePasswordToken );
  
        if ( userEmail != null ) {
           
            const filePath           = path.join(__dirname, '/web/resetPasswordSuccess.html');
            const html               = fs.readFileSync(filePath, 'utf8');;

            await db.query( query.updateChangePwdTokenIsNull, [ userEmail ] );
            await db.query( query.updateUserPassword,        [ newPassword, userEmail ] )
            return html
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/resetPasswordError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error ) {
        console.error( 'Error in updateNewPassword:', error.message );
        throw error;
    }
}