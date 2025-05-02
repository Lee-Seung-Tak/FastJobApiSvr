
const db                      = require('@db');
const queryJson               = require('@query');
const jsonwebtoken            = require('jsonwebtoken');
const { PG_UNIQUE_VIOLATION } = require('postgres-error-codes');
const dotenv                  = require('dotenv')
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

exports.signUp = async ( userData, userFiles ) => {
    try {
        console.log(userFiles)
        let queryResult = await db.query( queryJson.checkIdDuplicate, [ userData.userId ] );
        queryResult     = queryResult.rows[0];
        if (queryResult) throw new Error('user is duplicate');
        console.log('userData : ', userData, 'userFiles:', userFiles)
        //if
        
    } catch (error) {
        throw new Error(error)

    }
}