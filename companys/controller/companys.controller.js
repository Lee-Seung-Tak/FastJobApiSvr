const companysService = require('@companys_service');
const companysDTO     = require('@companys_dto');
const path            = require('path');


const signUpDTO   = companysDTO.SignUpDTO;

exports.signUp = async ( req, res ) => {
    try {
        const userData = signUpDTO.isValid    ( req.body );
        await companysService.signUp( userData );

        return res.status(201).json( {"message" : "Once you have completed your email authentication, your account will be activated."} );

    } catch ( error ) {
        console.log('[ERROR] - ', error)
        return res.status(400).json( { "message" : "Bad Request" } );
    }
}
