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

const swaggerJSDoc   = require('swagger-jsdoc');
const authRouter     = require('@auth_router');
const usersRouter    = require('@users_router');
const skillsRouter   = require('@skills_router');
const companysRouter = require('@companys_router');
const cors         = require("cors");

// Swagger설정 사용
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use( express.json() );
app.use(cors({
  origin: 'http://localhost:5173', // '*' 말고 정확한 주소
  credentials: true                // 쿠키 허용
}));

// MiddleWare 설정
// 조건문에 묶인 path는 Token 검증을 하지 않는 path
app.use( ( req, res, next ) => {
    if ( 
        // auth 관련 
        req.path === '/auth/login'                        || req.path === '/auth/signup'            || 
        req.path === '/auth/token-refresh'                || req.path === '/auth/reset-password'    ||
        req.path === '/auth/reset-password/verify'        || req.path === '/auth/new-password'      ||
        req.path === '/auth/recover-id'                   || req.path === '/auth/recover-id/verify' ||
        // company 관련
        req.path === '/companys/login'                    || req.path === '/companys/signup'        || 
        req.path === '/companys/signup-verify' 

    ) return next();

    middleWare.verifyToken( req, res, next );
})

// API Router 설정
app.use( '/skills',   skillsRouter   );
app.use( '/users',    usersRouter    );
app.use( '/auth',     authRouter     );
app.use( '/companys', companysRouter ); 

if (cluster.isMaster) {
    for (let i = 0; i< CPU; i++)
        cluster.fork();
} else {
    app.listen(port,()=>{
        console.log(`[LOG] - FastJobApiSvr Start at Port: ${port}\n`);
    });
}

