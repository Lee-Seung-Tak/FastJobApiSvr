const authService = require('@auth_service');
const authDTO     = require('@auth_dto');

const userNotFound   = 'user not found';
const reqBodyRequire = 'userId is not defined';
exports.login = async ( req, res ) => {
    try {

        // const { userId, password } = req.body;

        const loginDTO = authDTO.isValid( req.body );
        
        try {
            const serviceResult = await authService.login( userId, password );
            return res.status(201).json( serviceResult );
        } catch ( error ) {
            if ( error.message === userNotFound || error.message === reqBodyRequire)        
                return res.status(400).json( { "message" : "user not found" } );
        }

    } catch ( error ) {
        console.log('[ERROR] - auth.controller.login / error message : ', error.message);
    }
}