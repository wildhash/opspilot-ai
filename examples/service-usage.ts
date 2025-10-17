/**
 * Example: Using individual services
 */

import { CloudWatchService } from '../src/aws/cloudwatch';
import { BedrockService } from '../src/aws/bedrock';
import { LambdaService } from '../src/aws/lambda';

async function main() {
  const region = 'us-east-1';
  const functionName = 'my-lambda-function';

  // 1. CloudWatch Metrics Analysis
  console.log('=== CloudWatch Metrics ===');
  const cloudwatch = new CloudWatchService(region);
  
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 3600000); // Last hour
  
  const metrics = await cloudwatch.getLambdaMetrics(functionName, startTime, endTime);
  
  console.log('Error Count:', metrics.Errors.values.reduce((a, b) => a + b, 0));
  console.log('Average Duration:', metrics.Duration.values.reduce((a, b) => a + b, 0) / metrics.Duration.values.length);

  // 2. Query Logs
  console.log('\n=== CloudWatch Logs ===');
  const logGroupName = `/aws/lambda/${functionName}`;
  const logs = await cloudwatch.queryLogs(logGroupName, startTime, endTime, 'ERROR');
  
  console.log(`Found ${logs.length} error logs`);
  logs.slice(0, 3).forEach(log => {
    console.log(`  [${log.level}] ${log.message.substring(0, 100)}...`);
  });

  // 3. AI Diagnosis
  console.log('\n=== AI Diagnosis ===');
  const bedrock = new BedrockService(region);
  
  const diagnosis = await bedrock.diagnoseIncident(
    'Lambda function experiencing high error rate',
    { errors: metrics.Errors.values },
    logs.map(l => l.message)
  );
  
  console.log('Diagnosis:', diagnosis.substring(0, 200) + '...');

  // 4. Lambda Management
  console.log('\n=== Lambda Configuration ===');
  const lambda = new LambdaService(region);
  
  const config = await lambda.getFunctionConfig(functionName);
  console.log('Current Timeout:', config.Timeout);
  console.log('Current Memory:', config.MemorySize);
  
  // 5. Test Function
  console.log('\n=== Function Test ===');
  const testResult = await lambda.invokeFunction(functionName, { test: true });
  console.log('Test Status:', testResult.statusCode);
  console.log('Test Success:', !testResult.functionError);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
