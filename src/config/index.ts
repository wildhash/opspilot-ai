/**
 * Configuration management for OpsPilot
 */

export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
  },
  dynamodb: {
    tableName: process.env.DYNAMODB_TABLE_NAME || 'opspilot_audit',
  },
  demo: {
    dryRun: process.env.DRY_RUN === 'true',
    demoMode: process.env.DEMO_MODE === 'true',
  },
  lambda: {
    targetFunction: process.env.TARGET_LAMBDA_FUNCTION || 'orders-handler',
  },
};
