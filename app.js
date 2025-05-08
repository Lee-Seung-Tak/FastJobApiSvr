require('module-alias/register');

const express    = require('express');
const app        = express();
const port       = 4000

const middleWare = require('@middleware')
const cluster    = require('cluster');
const os         = require('os');
const CPU        = 2;

const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); 

const authRouter  = require('@auth_router')

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use( express.json() );

app.use( ( req, res, next ) => {
    if ( req.path === '/auth/login' || req.path === '/auth/signup' || req.path === '/auth/signup-verify') return next();
    middleWare.verifyToken( req, res, next );
})

// lst add - router 경로 항상 미들웨어 밑으로
app.use( '/auth', authRouter );


if (cluster.isMaster) {
    for (let i = 0; i< CPU; i++)
        cluster.fork();
} else {
    app.listen(port,()=>{
        console.log(`[LOG] - FastJobApiSvr Start at Port: ${port}\n`);
    });
}

