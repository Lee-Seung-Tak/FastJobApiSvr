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

const authRouter   = require('@auth_router');
const usersRouter  = require('@users_router');
const cors         = require("cors");
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use( express.json() );
app.use(cors({
  origin: 'http://localhost:5173', // ⚠️ '*' 말고 정확한 주소
  credentials: true                // 쿠키 허용
}));

app.use( ( req, res, next ) => {
    if ( req.path === '/auth/login' || req.path === '/auth/signup' || req.path === '/auth/token-refresh') return next();
    middleWare.verifyToken( req, res, next );
})

app.use( '/users', usersRouter );
app.use( '/auth',  authRouter );

if (cluster.isMaster) {
    for (let i = 0; i< CPU; i++)
        cluster.fork();
} else {
    app.listen(port,()=>{
        console.log(`[LOG] - FastJobApiSvr Start at Port: ${port}\n`);
    });
}

