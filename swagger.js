// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastJobAPI Docs',
      version: '1.0.0',
    },
  },
  apis: ['./auth/*.js', './routes/*.js', './users/*.js', './companys/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
