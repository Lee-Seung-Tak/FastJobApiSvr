
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
        let queryResult = await db.query( queryJson.login, [ userId ] );
        queryResult     = queryResult.rows[0];
        
        if(queryResult === undefined) throw new Error('user not found')
            
    } catch ( error ) {
        console.log('[ERROR] - auth.service.login / error message : ', error);
    }
}