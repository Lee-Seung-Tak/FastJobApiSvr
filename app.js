require('module-alias/register');

const express    = require('express');
const app        = express();
const port       = 4000

const middleWare = require('@middleware')
const cluster    = require('cluster');
const os         = require('os');
const CPU        = 2;


const authRouter = require('@auth_router')

app.use( express.json() );
const multer = require('multer');

app.use( '/auth', authRouter );
app.use( ( req, res, next ) => {
    if ( req.path === '/auth/login' || req.path === '/auth/signup') return next();
    middleWare.verifyToken( req, res, next );
})

if (cluster.isMaster) {
    for (let i = 0; i< CPU; i++)
        cluster.fork();
} else {
    app.listen(port,()=>{
        console.log(`[LOG] - FastJobApiSvr Start at Port: ${port}\n`);
    });
}

