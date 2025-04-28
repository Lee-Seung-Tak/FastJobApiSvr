
exports.verifyToken = ( req, res, next ) => {
    
    if( req.path === '/auth/login' || req.path === '/auth/signup')
    {
        return next();
    }
    console.log("[LOG] - middleware here");
    next();
}