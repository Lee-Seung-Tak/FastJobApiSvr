

const db           = require('@db');
const serviceLogic = require('@auth_logic');
const query        = require('@query');
const PENDING      = 1;
const NORMAL       = 2;
const EMAIL_FAILE  = 3;

exports.login = async( userId, password ) => {
    try {
        console.log(userId,'/',password)
        // DB에서 userId값이 있는지 조회
        let queryResult = await db.query( query.login, [ userId ] );
        queryResult     = queryResult.rows[0];
        console.log("queryResult: ", queryResult)
        // 없다면 Error
        if ( queryResult === undefined   ) throw new Error('user not found')
        
        if ( queryResult.role !== NORMAL ) throw new Error('user not found')

        console.log("here - 1")
        // 비밀번호 검증
        if ( queryResult.password === password ) {
            console.log("here - 2")
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
        console.log(error.message)
        throw new Error('user not found')
    }
}

//signUp 강사님 자문구해서 수정
exports.signUp = async ( userData ) => {

    try {
        // lst add / 비동기로 llm을 활용한 문서 요약 함수 실행
        serviceLogic.userDataAnalyze( userData );
        let queryResult = await db.query( query.checkIdDuplicate, [ userData.userId ] );
        queryResult  = queryResult.rows; //수정
        console.log('queryResult:', queryResult[0]); 
        if ( queryResult === undefined  ) throw new Error('user is duplicate'); //

        const signUpToken    = serviceLogic.makeSignUpToken  ( userData.email );
        
        const insertStatus   = await serviceLogic.insertUserData( userData, await signUpToken );
        if (insertStatus === true)
            serviceLogic.sendMailForSignUp( userData.email, signUpToken );

        else throw new Error(insertStatus)

    } catch (error) {
        throw new Error(error.message)
    }
}

exports.signUpVerify = async( signUpToken ) => {
    try {
        console.log(signUpToken);
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

//이메일 존재 확인 후 토큰 생성 및 이메일 전송
exports.requestPasswordReset = async (email) => {
    try {
        // 사용자 존재 확인
        const result = await db.query(query.requestPasswordReset, [email]);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        const resetToken = await serviceLogic.makeResetToken(email);
        await serviceLogic.sendResetEmail(email, resetToken);
        return true;
    } catch (error) {
        console.error('Password reset request error:', error.message);
        throw error;
    }
};

//토큰 검증 및 DB 토큰 일치 확인.
exports.verifyResetToken = async (token) => {
    try {
        const email = await serviceLogic.verifyResetToken(token);
        if (!email) return false;

        // DB에서 토큰 확인 
        const result = await db.query('SELECT reset_token FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0 || result.rows[0].reset_token !== token) {
            return false;
        }
        return email;
    } catch (error) {
        console.error('Token verification error:', error.message);
        return false;
    }
};