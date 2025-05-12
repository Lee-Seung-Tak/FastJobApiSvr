const usersService = require('@users_service');
const authDTO      = require('@auth_dto');
const path         = require('path');
const multer       = require('multer');
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
      const result = await usersService.getUserInfo( req.userId );
      return res.status(200).json({ data: result });

  } catch ( err ) {
      console.error(err);
      return res.status(400).json({ message: 'Bad request' });
  }
};

exports.patchUserProfileDocs = async (req, res) => {
  try {
    const uploadDir = path.resolve(__dirname, '../../uploads');
    // Object.values + flat 로 한번에 모든 파일을 배열로
    const filesArray = Object.values(req.files).flat();
    const result = await usersService.patchUserProfileDocs({
      userId:    req.userId,
      files:     filesArray,
      uploadDir,
    });
    console.log(filesArray)
    return res.status(200).json({ data: result });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message });
  }
};