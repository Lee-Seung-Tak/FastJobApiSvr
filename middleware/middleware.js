
exports.verifyToken = ( req, res, next ) => {
    console.log("[LOG] - middleware test");
    next();
}