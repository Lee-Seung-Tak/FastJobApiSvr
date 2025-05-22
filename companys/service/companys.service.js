const db            = require('@db');
const companysLogic = require('@companys_logic');
const query         = require('@query');
const PENDING       = 1;
const NORMAL        = 2;
const EMAIL_FAILE   = 3;
exports.signUp = async ( userData ) => {
    try {
      const queryResult = await db.query( query.checkCompanyIdDuplicate, [ userData.userId ] );
      if (queryResult.rows.length > 0) throw new Error('user is duplicate');
  
      const signUpToken = companysLogic.makeSignUpToken(userData.email);
      
      await Promise.all([
        companysLogic.insertUserData(userData, signUpToken),
        companysLogic.sendMailForSignUp(userData.email, signUpToken)
      ]);
  
      return { message: 'Signup successful. Please verify your email.' };
  
    } catch (error) {
      throw new Error( error.message );
    }
  };
  

// exports.signUp = async ( userData ) => {

//     try {
//         // lst add / 비동기로 llm을 활용한 문서 요약 함수 실행
       
//         let queryResult = await db.query( query.checkIdDuplicate, [userData.userId] );
//         queryResult     = queryResult.rows;
//         if ( queryResult == [] ) throw new Error('user is duplicate');

//         const signUpToken    = companysLogic.makeSignUpToken  ( userData.email );
//         await companysLogic.insertUserData( userData, await signUpToken );        
        
        
       
//         await companysLogic.sendMailForSignUp( userData.email, signUpToken );
        
        
//         throw new Error('sucess')
        
//     } catch (error) {
//         throw new Error(error.message)
//     }
// }