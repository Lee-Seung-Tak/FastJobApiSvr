
exports.verifyToken = ( req, res, next ) => {
    
    if( req.path === '/auth/login')
    {
        return next();
    }
    console.log("[LOG] - middleware here");
    next();
}