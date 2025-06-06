const companysService = require('@companys_service');
const companysDTO     = require('@companys_dto');
const path            = require('path');


const signUpDTO   = companysDTO.SignUpDTO;
const loginDTO    = companysDTO.LoginDTO;
exports.signUp = async ( req, res ) => {
    try {
        const userData = signUpDTO.isValid    ( req.body );
        await companysService.signUp( userData );

        return res.status(201).json( {"message" : "Once you have completed your email authentication, your account will be activated."} );

    } catch ( error ) {
        console.log('[ERROR] - ', error)
        return res.status(400).json( { "message" : "Bad Request" } );
    }
}

exports.login = async ( req, res ) => {
    try {
        
        const userData = loginDTO.isValid( req.body );
        console.log(userData);
        try {

            const serviceResult = await companysService.login( userData.userId, userData.password );
            
            res.cookie("refresh_token", serviceResult.refresh_token, {
                httpOnly: true,
                secure: false, // 배포시엔 true로 (HTTPS에서만 동작)
                sameSite: "Strict",
                maxAge: 1000 * 60 * 60 * 24 * 7 // 7일
            });
            
            return res.status(200).json({ access_token : serviceResult.access_token });

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


exports.signUpVerify = async ( req, res ) => {
    console.log(req);
    const verifyStatus = await companysService.signUpVerify( req.query.token );
    
    if ( verifyStatus ) return res.sendFile( path.join(__dirname, 'signup-success.html'));
    else                return res.sendFile( path.join(__dirname, 'token-error.html'   ));
  
  }