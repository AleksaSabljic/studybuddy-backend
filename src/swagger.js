const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudyBuddy API',
      version: '2.0.0',
      description: 'REST API for the StudyBuddy mobile application. Supports task management, file uploads, and role-based access control.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the JWT token from /auth/login',
        },
      },
    },
    tags: [
      { name: 'Auth',  description: 'Registration and login' },
      { name: 'Tasks', description: 'Task management (CRUD)' },
      { name: 'Files', description: 'Binary file upload and download' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
