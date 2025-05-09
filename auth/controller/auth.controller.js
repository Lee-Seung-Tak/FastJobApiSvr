const authService = require('@auth_service');
const authDTO     = require('@auth_dto');
const path        = require('path');

const loginDTO    = authDTO.LoginDTO;
const signUpDTO   = authDTO.SignUpDTO;


exports.login = async ( req, res ) => {
    try {
        const userData = loginDTO.isValid( req.body );

        try {

            const serviceResult = await authService.login( userData.userId, userData.password );
            return res.status(200).json( serviceResult );

        } catch ( error ) {
            // userId에 or password의 유효성 검사에 걸리는 exceptiond / http status : 401
            return res.status(401).json( { "message" : "check your id or password" } );
        }

    } catch ( error ) {
        console.log(error)
        // authDTO.isValid( req.body ); 데이터 유무 포함 유효성 검사에 걸리는 exception / http status : 400
        return res.status(400).json( { "message" : "Bad Request" } );
    }
}



exports.signUp = async ( req, res ) => {
    try {
        const userData = signUpDTO.isValid    ( req.body, req.files );
        await authService.signUp( userData );

        return res.status(201).json( {"message" : "Once you have completed your email authentication, your account will be activated."} );

    } catch ( error ) {
        console.log('[ERROR] - ', error)
        return res.status(400).json( { "message" : "Bad Request" } );
    }
}

exports.signUpVerify = async ( req, res ) => {

    const verifyStatus = await authService.signUpVerify( req.query.token );

    if ( verifyStatus ) return res.sendFile( path.join(__dirname, 'signup-success.html'));
    else                return res.sendFile( path.join(__dirname, 'token-error.html'   ));

}
