

const db           = require('@db');
const serviceLogic = require('@auth_logic');
const query        = require('@query');
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
            return { "access_token : " : accessToken , "refresh_token" : refreshToken };
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
