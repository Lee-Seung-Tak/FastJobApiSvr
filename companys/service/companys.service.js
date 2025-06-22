const db            = require('@db');
const companysLogic = require('@companys_logic');
const query         = require('@query');
const fs           = require('fs')
const path         = require('path');
const PENDING       = 1;
const NORMAL        = 2;
const EMAIL_FAILE   = 3;



exports.signUp = async ( companyData ) => {
    try {
      const queryResult = await db.query( query.checkCompanyIdDuplicate, [ companyData.companyId ] );
      if (queryResult.rows.length > 0) throw new Error('user is duplicate');
  
      const signUpToken = await companysLogic.makeSignUpToken( companyData.email );

      await companysLogic.insertCompanyData( companyData, signUpToken );
      await companysLogic.sendMailForSignUp( companyData.email, signUpToken );
      return { message: 'Signup successful. Please verify your email.' };
      
    } catch (error) {
      throw new Error( error.message );
    }
  };

exports.signUpVerify = async( signUpToken ) => {
    try {
        const decode    = await companysLogic.verifySignUpToken( signUpToken );
        let queryResult = await db.query ( query.checkCompanySignUpToken, [decode.email] );
        queryResult     = queryResult.rows[0].sign_token;

        if ( signUpToken === queryResult )
        {
            await db.query ( query.companySignupSuccess, [decode.email] );
            return true;

        } else return false;

    } catch ( error ) {
        console.log(error)
        return false;
    }
}

exports.login = async( companyId, password ) => {
    try {
        // DB에서 userId값이 있는지 조회
        let queryResult = await db.query( query.companyLogin, [ companyId ] );
        queryResult     = queryResult.rows[0];

        // 없다면 Error
        if (!queryResult || queryResult.role !== NORMAL) throw new Error('user not found');

        // 비밀번호 검증
        if ( queryResult.password === password ) {

            // token 생성 동시 시작 
            const [ accessToken, refreshToken ] = await Promise.all ( [ companysLogic.makeAccessToken(companyId), companysLogic.makeRefreshToken(companyId) ] );
            const updateDate                    = new Date();

            // db에 token 및 현재 시간 update
            await db.query( query.companyLoginSuccess, [ accessToken, refreshToken, updateDate, companyId ] );

            // token return
            return { "access_token" : accessToken , "refresh_token" : refreshToken };
        }
        else throw new Error('user not found')
        
    } catch ( error ) {
        throw new Error('user not found')
    }
}

exports.tokenRefresh = async( token ) => {
    try {
        const companyId = await companysLogic.verifyRefreshToken( token );
        if( companyId ) return await companysLogic.tokensRefresh( companyId );
        // lst add - cy feedback companyId가 null인 경우에 대한 처리도 되어야 합니다.
        // 사용자에게 token을 리턴하지 못하는 경우에 대한 처리도 해줘야합니다.
    } catch ( error ) {
        console.log("error : ", error.message)
        throw new Error(error);
    }
}

//비밀번호 초기화 및 검증
exports.resetPwd = async ( companyEmail ) => {
    try {
        const CompanyStatus         = (await db.query( query.IsUserValid, [ companyEmail ] )).rowCount;
        const resetPasswordToken    = await companysLogic.makeResetPwdToken( companyEmail );

        await db.query( query.updateResetCompanyPwdToken, [ resetPasswordToken, companyEmail ] );
        if ( CompanyStatus == 1 ) await companysLogic.sendMailResetPassword( companyEmail, resetPasswordToken );
        else return false;

        return true
    } catch ( error ) {
    console.error( 'Password reset request error:', error.message );
    throw error;
    }
}

exports.resetPwdTokenVerify = async ( resetPasswordToken ) => {
    try {
        const companyEmail = await companysLogic.verifyResetPwdToken( resetPasswordToken );

        if ( companyEmail != null ) {
            await db.query( query.updateResetCompanyPwdTokenIsNull, [ companyEmail ] );
            const filePath            = path.join(__dirname, '/web/setNewPassword.html');
            const html                = fs.readFileSync(filePath, 'utf8');
            const changePasswordToken = await companysLogic.makeChangePwdToken( companyEmail ) 
            const updatedHtml         = html.replace('{TOKEN}', changePasswordToken );
            
            await db.query( query.updateChangeCompanyPwdToken, [ changePasswordToken, companyEmail ] );
            return updatedHtml
            
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/resetPasswordError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error )
    {
        console.log(error)
    }
}

//비밀번호 재설정
exports.updateNewPwd = async ( changePasswordToken, newPassword ) => {
    try {
        const companyEmail = await companysLogic.verifyChangePwdToken( changePasswordToken );
  
        if ( companyEmail != null ) {
           
            const filePath           = path.join(__dirname, '/web/resetPasswordSuccess.html');
            const html               = fs.readFileSync(filePath, 'utf8');;

            await db.query( query.updateChangeCompanyPwdTokenIsNull, [ companyEmail ] );
            await db.query( query.updateCompanyPassword,        [ newPassword, companyEmail ] )
            return html
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/resetPasswordError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error ) {
        console.error( 'Error in updateNewPassword:', error.message );
        throw error;
    }
}

exports.sendVerificationEmailToUser = async ( companyEmail ) => {
    try {    
        const companyStatus      = (await db.query( query.IsCompanyValid, [ companyEmail ] )).rowCount;
        const getIdToken         = await companysLogic.makeIdVerificationToken( companyEmail );
        await db.query( query.updateCompanyIdToken, [ getIdToken, companyEmail ] );

        if ( companyStatus == 1 ) await companysLogic.sendMailCheckId( companyEmail, getIdToken );
        else return false;

        return { message: "Email sent successfully" };
    } catch ( error ) {
        console.log(error)
    }
}

exports.getUserIdAfterVerification = async ( checkToken ) => {
    try {
        const companyEmail = await companysLogic.verifyIdRecoveryToken( checkToken );
  
        if ( companyEmail != null ) {
     
            await db.query( query.updateCompanyIdFindTokenIsNull, [ companyEmail ] );
           
            const filePath           = path.join(__dirname, '/web/confirmId.html');
            const html               = fs.readFileSync(filePath, 'utf8');
            const getCompany         = await db.query(query.findCompanyId, [ companyEmail ] );
            const companyId          = getCompany.rows[0]?.company_id
            const updatedHtml        = html.replace('{USER_ID}', companyId.toString());
            
            return updatedHtml
        }
        
        else {
            const filePath    = path.join(__dirname, '/web/confirmIdError.html');
            const errorPage   =  fs.readFileSync(filePath, 'utf8');
            return errorPage
        }
    } catch ( error ) {
        console.error(error)       
    }
}

//채용공고 등록
exports.uploadRecruitJob = async ( companyData ) => {
    try {
        await companysLogic.uploadRecruitJob( companyData );
    } catch (error) {
        throw error;
    }
};


//채용공고 삭제
exports.deleteRecruitJob = async ( id ) => {
  try {
    const existingJob = await db.query( query.findRecruitJob, [ id ] );
    if ( !existingJob ) {
      throw new Error('채용 공고를 찾을 수 없습니다.');
    }
    const result = await db.query( query.deleteRecruitJob, [ id ] );
    return result.affectedRows > 0;
  } catch ( error ) {
    throw error;
  }
};

// exports.updateRecruitJob = async ( id, companyData) => {
//   try {
//     // 데이터 정제
//     const cleanedcompanyData = {
//       title: companyData.title?.trim(),
//       description: companyData.description?.trim(),
//       category: companyData.category?.trim(),
//       deadline: companyData.deadline
//     };

//     const updatedJob = await companysLogic.updateRecruitJob(id, cleanedcompanyData);
//     if (!updatedJob) {
//       throw new Error('채용 공고를 찾을 수 없습니다.');
//     }

//     return updatedJob;
//   } catch (error) {
//     throw error;
//   }

// }

exports.updateRecruitJob = async ( id, companyData) => {
  try {
    const updatedJob = await companysLogic.updateRecruitJob( id, companyData );
    if ( !updatedJob ) {
      throw new Error( 'Job posting not found.' );
    }

    return updatedJob;

  } catch ( error ) {
    throw error;
  }
}

exports.getApplicantsByPostId = async ( postId ) => {
  try {
    const result = await companysLogic.getApplicantsByPostId( postId );
    return result;
    
  } catch (error) {
    throw error;
  }
};