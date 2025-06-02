require('module-alias/register');

const express    = require('express');
const app        = express();
const port       = 4000

const middleWare = require('@middleware') //require로 외부의 모듈을 불러오기. @middleware는 불러올 모듈의 이름
const cluster    = require('cluster');
//여러 cpu를 활용하여 병렬로 작업 처리하는 것 = 클러스터링, 성능 높이기 위해 사용
//하나의 node.js 앱을 여러개의 프로세스로 나눠서 실행한다는 것.
const os         = require('os');
//운영체제 정보 가져오는 모듈듈
const CPU        = 2;
//병렬 작업에 사용할 코어 개수 의미

//Node.js 서버를 성능 좋게 만들기 위해, 여러 개의 작업자를 미리 준비하는 첫 단계

const swaggerUi   = require('swagger-ui-express'); //swagger-ui-express는 API 문서를 자동으로 웹에서 보여주는 도구.이걸 쓰면, 우리가 만든 API를 웹 페이지처럼 보기 좋게 정리해서 보여줄 수 있음.
const swaggerSpec = require('./swagger'); //내가 만든 Swagger 설정 파일. 어떤 엔드 포인트가 있고, 어떤 데이터가 오가는지 정의해 둔 문서. 
                                            //이걸 위에서 불러온 swagger-ui-express에 넘겨줘서 화면에 뿌려줄 수 있음.

const authRouter   = require('@auth_router'); // 로그인 등 인증 관련 API 라우터 불러오기
const usersRouter  = require('@users_router'); // 사용자 관련 API 라우터 불러오기
const cors         = require("cors"); //외부에서 내 API 호출을 허락해주는 미들웨어 불러오기
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); //app.use = Express의 미들웨어를 등록하는 메서드
app.use( express.json() ); //Express의 내장 미들웨어인 express.json()을 등록하여, 들어오는 요청의 본문(body)을 JSON 형식으로 파싱(parse)
app.use(cors({
  origin: 'http://localhost:5173', // ⚠️ '*' 말고 정확한 주소
  credentials: true                // 쿠키 허용
}));
 //브라우저에서 http://localhost:5173에서 보낸 요청은 서버가 허용하며, 쿠키를 포함한 요청도 처리할 수 있습니다.

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

