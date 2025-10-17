/**
 * Example: Basic incident handling
 */

import { OpsPilotAgent } from '../src/agent/opspilot';
import { Incident } from '../src/types';

async function main() {
  // Initialize the agent
  const agent = new OpsPilotAgent('us-east-1');

  // Create a sample incident
  const incident: Incident = {
    id: 'example-incident-1',
    timestamp: new Date(),
    severity: 'high',
    resourceArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-api-handler',
    resourceType: 'lambda',
    description: 'Lambda function experiencing high error rate and timeout issues',
    status: 'open',
    metrics: {
      errorRate: 25.5,
      avgDuration: 28000,
      throttles: 15
    },
    logs: [
      'ERROR: Task timed out after 30.00 seconds',
      'ERROR: Memory limit exceeded',
      'WARN: High memory usage detected'
    ]
  };

  console.log('Starting incident response for:', incident.id);
  console.log('Description:', incident.description);
  console.log('---');

  // Handle the incident (full workflow)
  const result = await agent.handleIncident(incident);

  console.log('\n=== DIAGNOSIS ===');
  console.log('Root Cause:', result.diagnosis.rootCause);
  console.log('Confidence:', result.diagnosis.confidence);
  console.log('Reasoning:', result.diagnosis.reasoning);

  console.log('\n=== REMEDIATION PLAN ===');
  console.log('Actions:', result.plan.actions.length);
  result.plan.actions.forEach((action, idx) => {
    console.log(`${idx + 1}. ${action.type}: ${action.description}`);
  });

  console.log('\n=== EXECUTION ===');
  console.log('Actions Executed:', result.executionResults.length);
  result.executionResults.forEach((exec, idx) => {
    console.log(`${idx + 1}. ${exec.success ? '✓' : '✗'} ${exec.actionId}`);
  });

  console.log('\n=== VERIFICATION ===');
  console.log('Success:', result.verification.success ? '✓' : '✗');
  console.log('Metrics Improved:', result.verification.metricsImproved ? '✓' : '✗');
  result.verification.checks.forEach(check => {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.name}: ${check.details}`);
  });

  console.log('\n=== SUMMARY ===');
  console.log('Incident Status:', result.verification.success ? 'RESOLVED' : 'REQUIRES ATTENTION');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
