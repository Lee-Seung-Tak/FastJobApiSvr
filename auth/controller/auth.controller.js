const authService = require('@auth_service');
const authDTO     = require('@auth_dto')


exports.login = async ( req, res ) => {
    try {
        const { email, password } = req.body;

        const loginDTO = authDTO.loginDTO.isValid( { email, password } );
        authService.login()
    } catch( error ) {
        if (error.message === 'Email and password are required')
            return res.status(400).json( { message : error.message } );
    }
}