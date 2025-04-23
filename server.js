require('module-alias/register');

const express = require('express');
const app     = express();
const port    = 4000

const cluster = require('cluster');
const os      = require('os');
const CPU     = 2;


const authRouter = require('./auth/auth.router')

app.use( express.json() );

app.use( '/auth', authRouter );

if (cluster.isMaster){
    for (let i = 0; i< CPU; i++)
        cluster.fork();
} else {
    app.listen(port,()=>{
        console.log(`[LOG] - FastJobApiSvr Start at Port: ${port}`);
    });
}

