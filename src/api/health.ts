/**
 * Health check API for OpsPilot
 * Verifies connectivity to AWS services
 */

import { config } from '../config';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

export interface HealthCheckResult {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: string; error?: string }>;
}

export async function healthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, { status: string; error?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check Bedrock client initialization
  try {
    const bedrock = new BedrockRuntimeClient({ region: config.aws.region });
    // Just verify we can create the client
    if (bedrock) {
      checks.bedrock = { status: 'ok' };
    }
  } catch (error: any) {
    checks.bedrock = { status: 'error', error: error.message };
    overallStatus = 'degraded';
  }

  // Check DynamoDB table
  try {
    const dynamo = new DynamoDBClient({ region: config.aws.region });
    await dynamo.send(new DescribeTableCommand({ 
      TableName: config.dynamodb.tableName 
    }));
    checks.dynamodb = { status: 'ok' };
  } catch (error: any) {
    checks.dynamodb = { status: 'error', error: error.message };
    overallStatus = 'degraded';
  }

  // Check target Lambda function
  try {
    const lambda = new LambdaClient({ region: config.aws.region });
    await lambda.send(new GetFunctionCommand({ 
      FunctionName: config.lambda.targetFunction 
    }));
    checks.lambda = { status: 'ok' };
  } catch (error: any) {
    checks.lambda = { status: 'error', error: error.message };
    overallStatus = 'degraded';
  }

  // If all checks failed, set status to unhealthy
  const allFailed = Object.values(checks).every(check => check.status === 'error');
  if (allFailed) {
    overallStatus = 'unhealthy';
  }

  return {
    timestamp: new Date().toISOString(),
    status: overallStatus,
    checks
  };
}
