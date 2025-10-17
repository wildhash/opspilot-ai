# Quick Start Guide

Get OpsPilot AI running in 5 minutes!

## Prerequisites

- Node.js 18+
- AWS Account
- AWS CLI configured
- Bedrock access enabled

## Step 1: Clone and Install

```bash
git clone https://github.com/wildhash/opspilot-ai.git
cd opspilot-ai
npm install
```

## Step 2: Configure AWS

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Verify AWS credentials
aws sts get-caller-identity
```

## Step 3: Build the Project

```bash
npm run build
```

This compiles TypeScript and builds the frontend.

## Step 4: Test Locally

### Option A: Use the CLI (Easiest)

```bash
# Run a test incident
npm run cli test-incident

# You'll see output like:
# 🚀 Testing OpsPilot with a sample incident...
# 📋 Incident Details:
#    ID: test-1234567890
#    Severity: high
#    Resource: arn:aws:lambda:us-east-1:123456789012:function:test-function
# ⏳ Processing incident...
# ✅ Incident Processing Complete!
# 📊 Results:
#    Root Cause: ...
#    Actions Executed: 2
#    Verification: ✓ PASSED
```

### Option B: Use the SDK

Create a file `test.ts`:

```typescript
import { OpsPilotAgent } from 'opspilot-ai';

async function main() {
  const agent = new OpsPilotAgent('us-east-1');
  
  const incident = {
    id: 'test-1',
    timestamp: new Date(),
    severity: 'high' as const,
    resourceArn: 'arn:aws:lambda:us-east-1:123:function:my-func',
    resourceType: 'lambda' as const,
    description: 'High error rate detected',
    status: 'open' as const
  };
  
  const result = await agent.handleIncident(incident);
  console.log('Result:', result);
}

main();
```

Run it:
```bash
npx ts-node test.ts
```

### Option C: Run the Frontend

```bash
# In one terminal
npm run dev:backend

# In another terminal  
npm run dev:frontend

# Open http://localhost:3000
```

## Step 5: Deploy to AWS (Optional)

### Using CDK

```bash
# First time only
cd cdk
npm install -g aws-cdk
cdk bootstrap

# Deploy
cdk deploy
```

### Using Manual Deployment

Follow the detailed guide in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Common Use Cases

### 1. Diagnose a Lambda Function Issue

```typescript
import { CloudWatchService, BedrockService } from 'opspilot-ai';

const cw = new CloudWatchService();
const bedrock = new BedrockService();

// Get metrics
const metrics = await cw.getLambdaMetrics(
  'my-function',
  new Date(Date.now() - 3600000),
  new Date()
);

// Get logs
const logs = await cw.queryLogs(
  '/aws/lambda/my-function',
  new Date(Date.now() - 3600000),
  new Date(),
  'ERROR'
);

// Diagnose with AI
const diagnosis = await bedrock.diagnoseIncident(
  'Function experiencing errors',
  metrics,
  logs.map(l => l.message)
);

console.log('Diagnosis:', diagnosis);
```

### 2. Update Lambda Configuration

```typescript
import { LambdaService } from 'opspilot-ai';

const lambda = new LambdaService();

// Update timeout and memory
await lambda.updateFunctionConfig('my-function', {
  timeout: 60,
  memorySize: 1024
});

// Test the function
const testResult = await lambda.invokeFunction(
  'my-function',
  { test: true }
);

console.log('Test result:', testResult);
```

### 3. Track Actions in Audit Trail

```typescript
import { DynamoDBService } from 'opspilot-ai';

const dynamodb = new DynamoDBService();

// Log an action
await dynamodb.logAudit({
  incidentId: 'inc-001',
  timestamp: new Date(),
  action: 'configuration_updated',
  actor: 'system',
  details: { timeout: 60, memory: 1024 },
  result: 'success'
});

// Get audit trail
const trail = await dynamodb.getAuditTrail('inc-001');
console.log('Audit trail:', trail);
```

### 4. Agentic Workflow with Tools

```typescript
import { BedrockService } from 'opspilot-ai';

const bedrock = new BedrockService();

const tools = {
  tools: [
    {
      toolSpec: {
        name: 'check_metrics',
        description: 'Check CloudWatch metrics',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              metricName: { type: 'string' }
            }
          }
        }
      }
    }
  ]
};

const result = await bedrock.executeAgenticWorkflow(
  'Investigate why my Lambda function is slow',
  tools,
  10
);

console.log('Tool calls:', result.toolCalls);
console.log('Final answer:', result.finalResponse);
```

## Troubleshooting

### Issue: "AccessDenied" when calling Bedrock

**Solution:** Enable model access in AWS Console:
1. Go to Bedrock console
2. Click "Model access" in left sidebar
3. Enable Claude 3 models
4. Wait 2-3 minutes for activation

### Issue: "Table does not exist" in DynamoDB

**Solution:** Initialize tables:
```typescript
import { DynamoDBService } from 'opspilot-ai';

const dynamodb = new DynamoDBService();
await dynamodb.initializeTable();
```

### Issue: Frontend won't build

**Solution:** Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
npm run build:frontend
```

### Issue: Lambda function not found

**Solution:** Use a real Lambda function ARN:
```bash
# List your functions
aws lambda list-functions --query 'Functions[*].FunctionArn'

# Use one in your test
npm run cli test-incident arn:aws:lambda:us-east-1:123:function:real-function
```

## Next Steps

- Read the [Architecture Guide](ARCHITECTURE.md)
- Review [API Documentation](API.md)
- Check out [Examples](../examples/)
- Deploy to production using [Deployment Guide](DEPLOYMENT.md)

## Getting Help

- Check the [GitHub Issues](https://github.com/wildhash/opspilot-ai/issues)
- Review the logs: `aws logs tail /aws/lambda/OpsPilot --follow`
- Enable debug logging: `export LOG_LEVEL=debug`

## Key Concepts to Remember

1. **Incidents** are the problems you want to solve
2. **Investigation** gathers metrics and logs
3. **Diagnosis** uses AI to find root cause
4. **Remediation** generates and executes fixes
5. **Verification** confirms the fix worked
6. **Audit Trail** records everything

## Quick Reference

```bash
# Build everything
npm run build

# Run tests
npm test

# Test with CLI
npm run cli test-incident

# Deploy to AWS
cd cdk && cdk deploy

# View logs
aws logs tail /aws/lambda/OpsPilot --follow

# List incidents
npm run cli list-incidents
```

That's it! You're ready to use OpsPilot AI. 🚀
