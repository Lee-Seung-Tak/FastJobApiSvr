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

exports.tokenRefresh = async ( req, res ) => {
    try {
        const tokens = await authService.tokenRefresh( req.body.refresh_token );
        return res.status(201).json({ tokens })
    } catch ( error ) {
        return res.status(401).json( { "message" : "check your refresh token"})
    }
}

exports.resetPassword = async ( req, res ) => {
    try {
        const resultStatus = await authService.resetPassword( req.body.email )

        if ( resultStatus )
            return res.status(200).json( {"message" : "success"} )

        else return res.status(401).json( { "message" : "check your email"})

    } catch ( error ) {
        return res.status(401).json( { "message" : "check your email"})
    }
}

exports.resetPasswordTokenVerify = async ( req, res ) => {
    try {
        const resetPasswordToken = req.query.token;
        const getPage            = await authService.resetPasswordTokenVerify( resetPasswordToken );
        return res.status(200).send(getPage)
    } catch ( error ) {
        console.log(error)
    }
}

exports.updateNewPassword = async ( req, res ) => {
    try {
        const updateToken = req.body.token;
        const newPassword = req.body.password;
  
        const getPage = await authService.updateNewPassword( updateToken,newPassword );
        
        return res.status(200).send(getPage)
    } catch ( error ) {

    }
}

exports.getUserIdByEmail = async ( req, res ) => {
    try{
        const email = req.body.email;
        const getId = await authService.findId( email );

        return res.status(200).send(getId)
    } catch ( error ) {
        console.log( error )
    }
}