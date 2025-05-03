

const db           = require('@db');
const serviceLogic = require('@auth_logic')

exports.login = async( userId, password ) => {
    try {
        // DB에서 userId값이 있는지 조회
        let queryResult = await db.query( query.login, [ userId ] );
        queryResult     = queryResult.rows[0];

        // 없다면 Error
        if ( queryResult === undefined ) throw new Error('user not found')
        
        // 비밀번호 검증
        if ( queryResult.password === password ) {

            // token 생성 동시 시작 
            const [ accessToken, refreshToken ] = await Promise.all ( [ serviceLogic.makeAccessToken(userId), serviceLogic.makeRefreshToken(userId) ] );
            const updateDate                    = new Date();

            // db에 token 및 현재 시간 update
            await db.query( query.loginSuccess, [ accessToken, refreshToken, updateDate, userId ] );

            // token return
            return { "access_token : " : accessToken , "refresh_token" : refreshToken };
        }
        else throw new Error('user not found')
        
    } catch ( error ) {
        throw new Error('user not found')
    }
}


exports.signUp = async ( userData, userFiles ) => {
    try {

        let queryResult = await db.query( query.checkIdDuplicate, [ userData.userId ] );
        queryResult     = queryResult.rows;
        if ( queryResult == [] ) throw new Error('user is duplicate');

        const signUpToken    = serviceLogic.makeSignUpToken  ( userData.email );
        const sendMailStatus = serviceLogic.sendMailForSignUp( userData.email );

        await insertUserData( userData, userFiles, signUpToken );
        await sendMailStatus;
        
    } catch (error) {
        throw new Error(error)

    }
}

exports.signUpVerify = async() => {

}