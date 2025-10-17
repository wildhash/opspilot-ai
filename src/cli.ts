#!/usr/bin/env node

/**
 * OpsPilot CLI - Command line interface for testing OpsPilot
 */

import { OpsPilotAgent } from './agent/opspilot';
import { Incident } from './types';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command) {
    printHelp();
    return;
  }

  const region = process.env.AWS_REGION || 'us-east-1';

  switch (command) {
    case 'test-incident':
      await testIncident(region);
      break;

    case 'list-incidents':
      await listIncidents(region);
      break;

    case 'help':
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

async function testIncident(region: string) {
  console.log('🚀 Testing OpsPilot with a sample incident...\n');

  const agent = new OpsPilotAgent(region);

  const functionArn = args[1] || 'arn:aws:lambda:us-east-1:123456789012:function:test-function';
  
  const incident: Incident = {
    id: `test-${Date.now()}`,
    timestamp: new Date(),
    severity: 'high',
    resourceArn: functionArn,
    resourceType: 'lambda',
    description: 'Test incident - Lambda function experiencing high error rate',
    status: 'open',
    metrics: {
      errorRate: 15.5,
      avgDuration: 25000,
      throttles: 5
    },
    logs: [
      'ERROR: Timeout after 30 seconds',
      'WARN: High memory usage',
      'ERROR: Unable to connect to dependency'
    ]
  };

  console.log('📋 Incident Details:');
  console.log(`   ID: ${incident.id}`);
  console.log(`   Severity: ${incident.severity}`);
  console.log(`   Resource: ${incident.resourceArn}`);
  console.log(`   Description: ${incident.description}`);
  console.log('');

  try {
    console.log('⏳ Processing incident (this may take a minute)...\n');
    
    const result = await agent.handleIncident(incident);

    console.log('✅ Incident Processing Complete!\n');
    
    console.log('📊 Results:');
    console.log('─────────────────────────────────────');
    console.log(`Root Cause: ${result.diagnosis.rootCause}`);
    console.log(`Confidence: ${(result.diagnosis.confidence * 100).toFixed(0)}%`);
    console.log(`Actions Planned: ${result.plan.actions.length}`);
    console.log(`Actions Executed: ${result.executionResults.length}`);
    console.log(`Verification: ${result.verification.success ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('─────────────────────────────────────\n');

    if (result.plan.actions.length > 0) {
      console.log('🔧 Remediation Actions:');
      result.plan.actions.forEach((action, idx) => {
        console.log(`   ${idx + 1}. ${action.type}: ${action.description}`);
      });
      console.log('');
    }

    if (result.verification.checks.length > 0) {
      console.log('🔍 Verification Checks:');
      result.verification.checks.forEach(check => {
        const icon = check.passed ? '✓' : '✗';
        console.log(`   ${icon} ${check.name}: ${check.details}`);
      });
      console.log('');
    }

    console.log(`\n🎉 Incident ${result.verification.success ? 'RESOLVED' : 'REQUIRES ATTENTION'}!`);
  } catch (error) {
    console.error('❌ Error processing incident:', error);
    process.exit(1);
  }
}

async function listIncidents(region: string) {
  console.log('📋 Listing recent incidents...\n');
  
  try {
    const { DynamoDBService } = await import('./aws/dynamodb');
    const dynamodb = new DynamoDBService(region);
    
    const incidents = await dynamodb.getOpenIncidents();
    
    if (incidents.length === 0) {
      console.log('No open incidents found.');
      return;
    }

    console.log(`Found ${incidents.length} open incident(s):\n`);
    
    incidents.forEach((incident, idx) => {
      console.log(`${idx + 1}. [${incident.severity.toUpperCase()}] ${incident.description}`);
      console.log(`   ID: ${incident.id}`);
      console.log(`   Status: ${incident.status}`);
      console.log(`   Resource: ${incident.resourceArn}`);
      console.log(`   Time: ${incident.timestamp}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing incidents:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
OpsPilot AI - Command Line Interface
═════════════════════════════════════

Usage: opspilot <command> [options]

Commands:
  test-incident [arn]    Test OpsPilot with a sample incident
                         Optional: Provide Lambda function ARN
  
  list-incidents         List all open incidents
  
  help                   Show this help message

Environment Variables:
  AWS_REGION            AWS region (default: us-east-1)

Examples:
  $ opspilot test-incident
  $ opspilot test-incident arn:aws:lambda:us-east-1:123:function:my-func
  $ opspilot list-incidents
  $ AWS_REGION=us-west-2 opspilot test-incident

For more information, visit: https://github.com/wildhash/opspilot-ai
  `);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
