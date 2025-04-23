const AuthServer = require('../service/auth.service');
const LoginDTO   = require('../dto/auth.dto')


exports.login = async ( req, res ) =>{
    try{
        const { email, password } = req.body;

        const loginDTO = LoginDTO.isValid({ email, password });
        AuthServer.login()
    }catch(error){
        if (error.message === 'Email and password are required')
            return res.status(400).json({ message : error.message });
    }
}