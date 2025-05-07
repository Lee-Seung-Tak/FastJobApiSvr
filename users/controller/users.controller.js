const usersService = require('@users_service');
const authDTO      = require('@auth_dto');

exports.patchUser = async (req, res) => {
    try { console.log(req.body);
      const result = await usersService.patchUser(req.body);
     
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.statusCode || 400).json({ message: err.message });
    }
  };