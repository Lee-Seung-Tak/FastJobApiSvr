const authService = require('@auth_service');
const authDTO     = require('@auth_dto');
const path        = require('path');

const loginDTO    = authDTO.LoginDTO;
const signUpDTO   = authDTO.SignUpDTO;

//사용자가 ID와 비밀번호를 입력해 로그인하면, 액세스 토큰과 리프레시 토큰을 발급함.
//exports = 이 파일을 외부에서 사용할 수 있게 내보내는 함수
exports.login = async ( req, res ) => {  //비동기 작업은 시간이 걸릴 수 있어서, 결과를 기다리기 위해 사용
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


//사용자가 회원가입 정보를 제출하고, 이메일 인증 안내를 받음.
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

//이메일 인증 링크를 통해 계정을 활성화.
exports.signUpVerify = async ( req, res ) => {

    const verifyStatus = await authService.signUpVerify( req.query.token );

    if ( verifyStatus ) return res.sendFile( path.join(__dirname, 'signup-success.html'));
    else                return res.sendFile( path.join(__dirname, 'token-error.html'   ));

}

//리프레시 토큰으로 새 액세스 토큰을 발급받음.
exports.tokenRefresh = async ( req, res ) => {
    try {
        const tokens = await authService.tokenRefresh( req.body.refresh_token );
        return res.status(201).json({ tokens })
    } catch ( error ) {
        return res.status(401).json( { "message" : "check your refresh token"})
    }
}