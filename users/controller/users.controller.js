const usersService = require('@users_service');
const usersLogic   = require('@users_logic');
exports.patchUser = async ( req, res ) => {

  try { 
    const result = await usersService.patchUser(req);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

exports.getUser = async ( req, res ) => {
  
  try {
      const [result, userSkills] = await Promise.all([
        usersService.getUser(req.userId),
        usersService.getUserSkillsByUserId(req.userId)
    ]);
      // const result = await usersService.getUser( req.userId );
      // const userSkills = await usersService.getUserSkillsByUserId(req.userId);
      
      return res.status(200).json({ 
        data: result,
        skills: userSkills
      });

  } catch ( err ) {
      console.error(err);
      return res.status(400).json({ message: 'Bad request' });
  }
};

// lst add - 함수를 구현할 때 DB 저장되는 파일 외, LLM이 요약한 내용을 유저가 직접 수정하고 싶을 수 있습니다.
// 그렇기 때문에 form-data를 사용한 것 입니다. 
// 파일과 resume에 저장된 컬럼의 내용도 수정할 수 있어야 하기 때문입니다.
// 그렇기 때문에, 파일들인 경우 EX) resumeFile 로 postman으로 전송, svr에서도 resumeFile 이런식으로 받으셔야 합니다.
// 일반 DB에 저장된 내용을 수정하고 싶을 경우는 EX) resume 이렇게 받으면 LLM이 요약한 내용을 수정할 수 있어야 합니다.
// 제가 설계한 의도는 그렇습니다.

exports.patchUserProfileDocs = async (req, res) => {

  try {
    await usersService.patchUserProfileDocs({
      userId:    req.userId,
      files:     req.files,
      texts: {
        resumeText: req.body.resumeText,
        selfIntroText: req.body.selfIntroText,
        careerDescText: req.body.careerDescText
      }
    });

    return res.status(200).json( { "message" : "Update Success" } );

  } catch (err) {
    return res.status(400).json("Bad Request");
  }
};

exports.myJobApplications = async ( req, res ) => {

  try {
    const result = await usersService.myJobApplications( req.userId );
    return res.status( 200 ).json( result );
  } catch (err) {
    return res.status(400).json({ message: "Bad Request" });
  }
};

exports.updateUserApplicationPost = async ( req, res ) => {
  try {

    const postId          = req.body.postId;
    const userId          = req.userId;
    const result          = await usersService.updateUserApplicationPost( userId, postId );
    return res.status( 200 ).json({ message : "Update Success" });
  } catch (err) {
    console.log("err:", err)
    return res.status( 400 ).json({ message: "Bad Request" });
  }
};