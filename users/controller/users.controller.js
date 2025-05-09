const usersService = require('@users_service');
const authDTO      = require('@auth_dto');

exports.patchUser = async ( req, res ) => {

  try { 
    const result = await usersService.patchUser(req);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
};

exports.getUser = async ( req, res ) => {
  console.log(req.userId)
  try {
      const result = await usersService.getUserInfo( req.userId );
      return res.status(200).json({ data: result });

  } catch ( err ) {
      console.error(err);
      return res.status(400).json({ message: 'Bad request' });
  }
};