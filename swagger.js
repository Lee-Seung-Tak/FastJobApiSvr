const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastJobAPI Docs',
      version: '1.0.0',
      description: '빠른 구직을 위한 FastJob API 문서입니다',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./auth/*.js', './routes/*.js', './users/*.js', './companys/*.js','./skills/*.js',],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;