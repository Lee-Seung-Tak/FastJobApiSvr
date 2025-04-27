const authService = require('@auth_service');
const authDTO     = require('@auth_dto');

exports.login = async ( req, res ) => {
    try {
        
        const loginDTO = authDTO.isValid( req.body );
        
        try {

            const serviceResult = await authService.login( loginDTO.userId, loginDTO.password );
            return res.status(201).json( serviceResult );

        } catch ( error ) {
            // userId에 or password의 유효성 검사에 걸리는 exceptiond / http status : 401
            return res.status(401).json( { "message" : "check your id or password" } );
        }

    } catch ( error ) {
        // authDTO.isValid( req.body ); 데이터 유무 포함 유효성 검사에 걸리는 exception / http status : 400
        return res.status(400).json( { "message" : "Bad Request" } );
    }
}