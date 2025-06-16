const companysService = require('@companys_service');
const companysDTO     = require('@companys_dto');
const path            = require('path');
const query          = require('@query');
const db             = require('@db');

const signUpDTO   = companysDTO.SignUpDTO;
const loginDTO    = companysDTO.LoginDTO;
exports.signUp = async ( req, res ) => {
    try {
        const companyData = signUpDTO.isValid ( req.body );
        await companysService.signUp( companyData );

        return res.status(201).json( {"message" : "Once you have completed your email authentication, your account will be activated."} );

    } catch ( error ) {
        console.log('[ERROR] - ', error)
        return res.status(400).json( { "message" : "Bad Request" } );
    }
}

exports.signUpVerify = async ( req, res ) => {
    console.log(req);
    const verifyStatus = await companysService.signUpVerify( req.query.token );
    
    if ( verifyStatus ) return res.sendFile( path.join(__dirname, 'signup-success.html'));
    else                return res.sendFile( path.join(__dirname, 'token-error.html'   ));
  
  }

exports.login = async ( req, res ) => {
    try {
        
        const companyData = loginDTO.isValid( req.body );
        console.log(companyData);
        try {

            const serviceResult = await companysService.login( companyData.companyId, companyData.password );
            
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


exports.tokenRefresh = async ( req, res ) => {
    try {
        const tokens = await companysService.tokenRefresh( req.body.refresh_token );
        return res.status(201).json({ tokens })
    } catch ( error ) {
        return res.status(401).json( { "message" : "check your refresh token"})
    }
}

//PWD 찾기 
exports.resetPassword = async ( req, res ) => {
    try {
        const email        = req.body.email;
        const queryResult  = await db.query(query.duplicateCompanyEmail, [email]);

        if ( queryResult.rowCount === 0 ) {
            return res.status(404).json({ message: 'No account is associated with this email address.' });
        }

        const resultStatus = await companysService.resetPwd( email )

        if ( resultStatus ) {
            return res.status(200).json( {"message" : "success"} )
        }

        return res.status(400).json({ message: 'check your email' });

    } catch ( error ) {
        return res.status(500).json( { "message" : "An error occurred. Please try again later."})
    }
}

exports.resetPasswordTokenVerify = async ( req, res ) => {
    try {
        const resetPasswordToken = req.query.token;
        const getPage            = await companysService.resetPwdTokenVerify( resetPasswordToken );
        return res.status(200).send(getPage)
    } catch ( error ) {
        console.log(error)
    }
}

//PWD 재설정
exports.updateNewPassword = async ( req, res ) => {
    try {
        const updateToken = req.body.token;
        const newPassword = req.body.password;
  
        const getPage = await companysService.updateNewPwd( updateToken,newPassword );
        
        return res.status(200).send(getPage)
    } catch ( error ) {

    }
}

//ID 찾기
exports.sendVerificationEmailToUser = async ( req, res ) => {
    try{
        const email = req.body.email;
        const queryResult = await db.query(query.duplicateCompanyEmail, [email]);

        if (queryResult.rowCount === 0) {
            return res.status(401).json({ message: 'No account is associated with this email address.' });
        }

        const getId = await companysService.sendVerificationEmailToUser( email );
        
        return res.status(200).send(getId)
    } catch ( error ) {
        console.log( error )
    }
}

exports.getUserIdAfterVerification = async ( req, res ) => {
    try{
        const token = req.query.token;
        if ( !token ) {
            return res.status(400).send('Token is missing.');
        }
        const html = await companysService.getUserIdAfterVerification(token);
        return res.status(200).send(html);
    } catch ( error ) {
        console.error('Error retrieving user ID:', error);
        throw error;
    }
}

exports.uploadRecruitJob

exports.updateRecruitJob

exports.deleteRecruitJob