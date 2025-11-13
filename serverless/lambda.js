// AWS Lambda handler for serverless deployment
const serverless = require('serverless-http');
const express = require('express');
const { registerRoutes } = require('../server/routes');

const app = express();

// Configure for Lambda
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Register routes
registerRoutes(app);

// Export handler for Lambda
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
});

// For local testing
if (!process.env.LAMBDA_TASK_ROOT) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}