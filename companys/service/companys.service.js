const db            = require('@db');
const companysLogic = require('@companys_logic');
const query         = require('@query');
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

exports.signUpVerify = async( signUpToken ) => {
    try {
        console.log(signUpToken)
        const decode    = await companysLogic.verifySignUpToken( signUpToken );
        let queryResult = await db.query ( query.companyCheckSignUpToken, [decode.email] );
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