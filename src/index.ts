/**
 * Main entry point for OpsPilot AI
 */

export * from './types';
export * from './agent/opspilot';
export * from './aws/bedrock';
export * from './aws/cloudwatch';
export * from './aws/lambda';
export * from './aws/dynamodb';
export * from './lambda/handler';

// Re-export for convenience
export { OpsPilotAgent } from './agent/opspilot';
export { BedrockService } from './aws/bedrock';
export { CloudWatchService } from './aws/cloudwatch';
export { LambdaService } from './aws/lambda';
export { DynamoDBService } from './aws/dynamodb';

import { BedrockService } from './aws/bedrock';
import { CloudWatchService } from './aws/cloudwatch';
import { LambdaService } from './aws/lambda';
import { ActionPlan, MetricSeries, IncidentContext } from './types';

/**
 * Main orchestrator function for running incident response
 */
export async function runIncident(
  incidentText: string,
  functionName: string,
  region: string = 'us-east-1'
): Promise<{
  plan: ActionPlan;
  before: MetricSeries[];
  after: MetricSeries[];
}> {
  const bedrock = new BedrockService(region);
  const cloudwatch = new CloudWatchService(region);
  const lambda = new LambdaService(region);

  // Get function configuration
  const functionConfig = await lambda.getFunctionConfiguration(functionName);

  // Get recent metrics (last 15 minutes)
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 15 * 60 * 1000);

  const metricsData = await Promise.all([
    cloudwatch.getMetrics('AWS/Lambda', 'Errors', { FunctionName: functionName }, startTime, endTime, 60),
    cloudwatch.getMetrics('AWS/Lambda', 'Duration', { FunctionName: functionName }, startTime, endTime, 60),
    cloudwatch.getMetrics('AWS/Lambda', 'Throttles', { FunctionName: functionName }, startTime, endTime, 60)
  ]);

  const metrics: MetricSeries[] = metricsData.map(m => ({
    metric: m.metricName,
    values: m.values,
    timestamps: m.timestamps
  }));

  // Get recent errors
  const logs = await cloudwatch.queryLogs(`/aws/lambda/${functionName}`, startTime, endTime, 'ERROR');
  const recentErrors = logs.map((log: any) => ({
    message: log.message,
    timestamp: log.timestamp
  }));

  // Build incident context
  const context: IncidentContext = {
    incidentText,
    functionConfig,
    metrics,
    recentErrors,
    constraints: {
      maxMemoryMB: 3008,
      maxTimeoutSec: 900,
      regionAllowlist: ['us-east-1', 'us-west-2', 'eu-west-1'],
      requireVerify: true
    }
  };

  // Generate plan
  const { plan } = await bedrock.planRemediation(context, true);

  // Apply changes if specified in plan
  if (plan.changes.lambda) {
    const updateConfig: any = {};
    if (plan.changes.lambda.memoryMb) {
      updateConfig.MemorySize = plan.changes.lambda.memoryMb;
    }
    if (plan.changes.lambda.timeoutSec) {
      updateConfig.Timeout = plan.changes.lambda.timeoutSec;
    }
    if (plan.changes.lambda.reservedConcurrency !== undefined) {
      // TODO: Implement putFunctionConcurrency method in LambdaService
      // This requires a separate PutFunctionConcurrencyCommand API call
      // await lambda.putFunctionConcurrency(functionName, plan.changes.lambda.reservedConcurrency);
    }
    
    if (Object.keys(updateConfig).length > 0) {
      await lambda.updateFunctionConfiguration(functionName, updateConfig);
    }
  }

  // Get "after" metrics (wait a bit for changes to propagate, then get recent data)
  // In real scenario, this would be a longer wait. For demo, we'll use slightly different time window
  const afterStartTime = new Date(endTime.getTime() - 5 * 60 * 1000);
  const afterEndTime = new Date();

  const afterMetricsData = await Promise.all([
    cloudwatch.getMetrics('AWS/Lambda', 'Errors', { FunctionName: functionName }, afterStartTime, afterEndTime, 60),
    cloudwatch.getMetrics('AWS/Lambda', 'Duration', { FunctionName: functionName }, afterStartTime, afterEndTime, 60),
    cloudwatch.getMetrics('AWS/Lambda', 'Throttles', { FunctionName: functionName }, afterStartTime, afterEndTime, 60)
  ]);

  const after: MetricSeries[] = afterMetricsData.map(m => ({
    metric: m.metricName,
    values: m.values,
    timestamps: m.timestamps
  }));

  return {
    plan,
    before: metrics,
    after
  };
}
