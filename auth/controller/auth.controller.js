const AuthServer = require('../service/auth.service');
const LoginDTO   = require('../dto/auth.dto')


exports.login = async ( req, res ) =>{
    //1. cluster 사용 
    //2. 2개의 코어 사용
    try{
        const { email, password } = req.body;
        const loginData           = new LoginDTO( email, password );
        LoginDTO.isValid( loginData );

        AuthServer.login()
    }catch(error){
        if (error.message === 'Email and password are required')
            return res.status(400).json({ message : error.message });
    }
}