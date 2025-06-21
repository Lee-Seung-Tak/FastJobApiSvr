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
    const verifyStatus = await companysService.signUpVerify( req.query.token );
    
    if ( verifyStatus ) return res.sendFile( path.join(__dirname, 'signup-success.html'));
    else                return res.sendFile( path.join(__dirname, 'token-error.html'   ));
  
  }

exports.login = async ( req, res ) => {
    try {
        
        const companyData = loginDTO.isValid( req.body );
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
        const resultStatus = await companysService.resetPwd( email );

        if ( resultStatus ) {
            return res.status(200).json( {"message" : "success"} )
        }

        return res.status(400).json({ message: 'check your email' });

    } catch ( error ) {
        return res.status(500).json( { "message" : "An error occurred. Please try again later."})
    }
}

// 비밀번호 찾기 인증하기
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
        console.log(error)
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

//채용공고 등록
exports.uploadRecruitJob = async ( req, res ) => {
  try {
    const { title, description, category, deadline } = req.body;

    if ( !title || !description || !category || !deadline ) {
      return res.status(400).json({ message: 'title, description, category, deadline은 필수입니다.' });
    }

    // lst add - cy feedback
    `
        const categoryNum = Number(category);
            if ( isNaN(categoryNum) || categoryNum < 1 || categoryNum > 100 ) {
            return res.status(400).json({ message: '유효하지 않은 category 값입니다.' });
        }
        이 부분은 채용 공고에서 카테고리를 위해서 추가하신 의도로 보입니다.

        db명세를 보시면 category는 분야(reference.dev_category참조)가 확인이 되는데, 이는 우리가 db에 사전에 정의하지
        않은 값은 넣을 수 없다는 것 입니다.

        이해하시기 편하게 예시를 들어드리자면, 웹에서는 미리 카테고리 전체에 대하여 서버로 부터 전달 받고, 사용자가 거기에 적용된
        category만 선택할 수 있게 되는 것이기 때문에 아래의 category 검증 로직은 삭제하셔도 무방합니다.
   
    `
    const categoryNum = Number(category);
    if ( isNaN(categoryNum) || categoryNum < 1 || categoryNum > 100 ) {
    return res.status(400).json({ message: '유효하지 않은 category 값입니다.' });
    }

    // 채용 공고 생성
    await companysService.uploadRecruitJob( req.body );

    return res.status(201).json({ message: '채용 공고 등록 완료' });
  } catch (error) {
    console.error('Upload recruit job error:', error);
    
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

//채용공고 삭제
exports.deleteRecruitJob = async ( req, res ) => {
    try {
      const { id } = req.params;

      await companysService.deleteRecruitJob( id );

      return res.status(200).json({
        message: '채용 공고가 성공적으로 삭제되었습니다.'
      });

    // lst add - cy feedback
    `
      에러를 세분화한것은 좋은 시도입니다.
       if ( error.message === 'Unauthorized' ) -> 여기는 토큰 검증에서 처리해야할 에러입니다.
       API call을 한 사용자의 권한이 없는 경우 상기 에러가 리턴 되어야 함으로, 미들웨어단에서 처리되면 될 것 같습니다.

       + 에러 메세지는 영어로 작성하는 것이 권고사항입니다.
    `

    } catch (error) {
      if ( error.message === 'Unauthorized' ) {
        return res.status(401).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
      }
      if ( error.message === '채용 공고를 찾을 수 없습니다.' ) {
        return res.status(404).json({ message: error.message });
      }
      console.error( '채용 공고 삭제 오류:', error );
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }

// //채용공고 수정
// exports.updateRecruitJob = async ( req, res ) => {
//     try {
//       const { id } = req.params;
//       const { title, description, category, deadline } = req.body;

//       if ( !title || !description || !category || !deadline ) {
//       return res.status(400).json({ message: 'title, description, category, deadline은 필수입니다.' });
//       }

//        const updatedJob = await companysService.updateRecruitJob (id, { title, description, category, deadline });
//        return res.status(200).json({message: '채용 공고가 성공적으로 수정되었습니다.'
//       });
//     } catch (error) {
//       if (error.message === 'Unauthorized') {
//         return res.status(401).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
//       }
//       console.error('채용 공고 수정 오류:', error);
//       return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
//     }
//   }