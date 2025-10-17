# OpsPilot AI 🚀

**AI-powered incident response agent that diagnoses and fixes AWS issues autonomously**

OpsPilot AI is an agentic AI system built for the AWS Agentic AI Hackathon that demonstrates end-to-end incident response workflows with intelligent tool chaining. It ingests production incidents, investigates AWS CloudWatch metrics and logs, uses Bedrock to diagnose root causes, generates safe remediation plans with guardrails, executes fixes via AWS SDK, verifies success through test invocations and metric validation, and maintains a full audit trail in DynamoDB.

[![AWS](https://img.shields.io/badge/AWS-Bedrock-FF9900?logo=amazon-aws)](https://aws.amazon.com/bedrock/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Key Features

### Agentic AI Capabilities
- **🤖 Intelligent Tool Chaining**: Uses AWS Bedrock's Converse API with tool use for multi-step reasoning
- **🔍 Autonomous Investigation**: Automatically gathers metrics, logs, and configuration data
- **💡 AI-Powered Diagnosis**: Leverages Claude 3 to analyze symptoms and identify root causes
- **🛠️ Smart Remediation**: Generates context-aware fix plans with safety guardrails
- **✅ Automated Verification**: Tests fixes and validates success through metrics

### Production-Ready Features
- **🛡️ Safety Guardrails**: Rate limiting, rollback plans, and approval workflows
- **📊 Full Observability**: Complete audit trail in DynamoDB for compliance
- **⚡ Auto-Execution**: Safe automated remediation with verification
- **🎨 Modern Dashboard**: Next.js frontend for monitoring and control
- **☁️ Cloud Native**: Built entirely on AWS services (Bedrock, Lambda, CloudWatch, DynamoDB)

## 🎬 Quick Demo (5 minutes)

### Prerequisites
- AWS account with Bedrock, Lambda, CloudWatch, and DynamoDB access
- AWS CLI configured
- Node.js 18+

### Setup Demo Environment

```bash
# 1. Clone and install
git clone https://github.com/wildhash/opspilot-ai.git
cd opspilot-ai
npm install && cd frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your AWS credentials and region

# 3. Run demo seed script
chmod +x scripts/seed-demo.sh
./scripts/seed-demo.sh

# 4. Start the application
# Terminal 1:
npm run dev:backend

# Terminal 2:
npm run dev:frontend
```

### Run the Demo

1. **Open dashboard:** http://localhost:3000
2. **Create incident:** Paste this text:
   ```
   Lambda orders-handler in us-east-1 is experiencing high timeout rate and errors
   ```
3. **Watch OpsPilot:**
   - Investigate metrics and logs autonomously
   - Diagnose root cause using Bedrock AI
   - Generate safe remediation plan
   - Execute fix with verification
   - Show before/after metrics

4. **View audit trail:** Check DynamoDB table for complete action log

### Demo Features Showcase

- ✅ **Agentic Workflow:** Multi-step autonomous investigation
- ✅ **AI Diagnosis:** Bedrock analyzes symptoms and identifies root cause
- ✅ **Smart Remediation:** Context-aware fix generation
- ✅ **Safety Guardrails:** Validation before execution
- ✅ **Automated Verification:** Confirms fix success
- ✅ **Complete Audit Trail:** Full logging in DynamoDB

### Troubleshooting

**Backend won't start:**
```bash
# Check health endpoint
curl http://localhost:3001/health
```

**Bedrock access denied:**
- Enable Bedrock model access in AWS Console
- Or set `DRY_RUN=true` in .env for offline demo

**No errors in CloudWatch:**
- Wait 2-3 minutes for metrics to populate
- Re-run: `./scripts/seed-demo.sh`

## 🏗️ Architecture

```
┌─────────────────┐
│   Incident      │
│   Detection     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           OpsPilot AI Agent                 │
│                                             │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐│
│  │CloudWatch│──▶│ Bedrock  │──▶│ Lambda  ││
│  │Metrics & │   │   AI     │   │  SDK    ││
│  │  Logs    │   │Diagnosis │   │Execute  ││
│  └──────────┘   └──────────┘   └─────────┘│
│                                             │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐│
│  │Verification◀──│Remediation│  │DynamoDB ││
│  │& Metrics │   │   Plan    │  │  Audit  ││
│  └──────────┘   └──────────┘   └─────────┘│
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Next.js       │
│   Dashboard     │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- AWS Account with:
  - Bedrock access (Claude 3 model enabled)
  - IAM permissions for Lambda, CloudWatch, DynamoDB
- AWS CLI configured

### Installation

```bash
# Clone the repository
git clone https://github.com/wildhash/opspilot-ai.git
cd opspilot-ai

# Install dependencies
npm install

# Build the project
npm run build

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Local Development

```bash
# Terminal 1: Build backend in watch mode
npm run dev:backend

# Terminal 2: Run frontend
npm run dev:frontend
```

Visit http://localhost:3000 to see the dashboard.

### Deploy to AWS

```bash
# Build the project
npm run build

# Deploy using CDK
cd cdk
npx cdk deploy
```

## 📖 Usage

### Example 1: Handle an Incident

```typescript
import { OpsPilotAgent } from 'opspilot-ai';

const agent = new OpsPilotAgent('us-east-1');

const incident = {
  id: 'inc-001',
  timestamp: new Date(),
  severity: 'high',
  resourceArn: 'arn:aws:lambda:us-east-1:123456789:function:api-handler',
  resourceType: 'lambda',
  description: 'High error rate and timeout issues',
  status: 'open'
};

// Full automated workflow
const result = await agent.handleIncident(incident);

console.log('Diagnosis:', result.diagnosis.rootCause);
console.log('Actions Taken:', result.executionResults.length);
console.log('Resolved:', result.verification.success);
```

### Example 2: Agentic Workflow with Tools

```typescript
import { BedrockService } from 'opspilot-ai';

const bedrock = new BedrockService('us-east-1');

const tools = {
  tools: [
    {
      toolSpec: {
        name: 'analyze_metrics',
        description: 'Analyze CloudWatch metrics',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              functionName: { type: 'string' },
              metricName: { type: 'string' }
            }
          }
        }
      }
    }
  ]
};

const result = await bedrock.executeAgenticWorkflow(
  'Investigate high error rate in api-handler function',
  tools,
  10 // max iterations
);

console.log('Tool Calls:', result.toolCalls);
console.log('Final Response:', result.finalResponse);
```

### Example 3: Lambda Handler

```typescript
// Deploy as Lambda function
import { handler } from 'opspilot-ai';

export { handler };

// Invoke with incident data
const event = {
  severity: 'critical',
  resourceArn: 'arn:aws:lambda:...',
  resourceType: 'lambda',
  description: 'Service outage detected'
};
```

## 🔧 Components

### Core Agent (`src/agent/opspilot.ts`)
The main orchestrator that:
- Coordinates the entire incident response workflow
- Manages tool execution and state
- Implements safety checks and guardrails
- Tracks all actions in audit trail

### AWS Integrations

#### CloudWatch Service (`src/aws/cloudwatch.ts`)
- Fetches metrics for Lambda, ECS, EC2, RDS
- Queries logs with pattern filtering
- Detects anomalies using statistical analysis
- Provides time-series data for AI analysis

#### Bedrock Service (`src/aws/bedrock.ts`)
- Integrates with Claude 3 via Converse API
- Implements tool use for agentic workflows
- Handles multi-turn conversations
- Supports streaming responses

#### Lambda Service (`src/aws/lambda.ts`)
- Manages Lambda configuration updates
- Executes test invocations
- Performs health checks
- Handles rollback procedures

#### DynamoDB Service (`src/aws/dynamodb.ts`)
- Maintains complete audit trail
- Stores incident history
- Tracks remediation plans
- Provides query capabilities

### Frontend (`frontend/`)
- Next.js 14 with App Router
- Tailwind CSS for styling
- Real-time incident dashboard
- Audit trail visualization

## 🎓 How It Works

### 1. Incident Ingestion
```typescript
// Incidents can be created manually or from monitoring alerts
const incident: Incident = {
  id: generateId(),
  severity: 'high',
  resourceArn: 'arn:aws:...',
  description: 'High error rate detected'
};
```

### 2. Investigation Phase
```typescript
// Agent gathers data from multiple sources
const metrics = await cloudwatch.getLambdaMetrics(functionName);
const logs = await cloudwatch.queryLogs(logGroupName);
const config = await lambda.getFunctionConfig(functionName);
```

### 3. AI Diagnosis
```typescript
// Bedrock analyzes all gathered data
const diagnosis = await bedrock.diagnoseIncident(
  incident.description,
  metrics,
  logs
);
// Returns root cause, confidence, reasoning
```

### 4. Remediation Planning
```typescript
// AI generates safe remediation plan
const plan = await bedrock.generateRemediationPlan(
  diagnosis,
  resourceArn,
  currentConfig
);
// Includes actions, safety checks, rollback procedures
```

### 5. Execution with Guardrails
```typescript
// Safety checks before execution
const safetyChecks = performSafetyChecks(plan);
if (!safetyChecks.every(c => c.passed)) {
  requireApproval();
}

// Execute actions in order
for (const action of plan.actions) {
  await executeAction(action);
}
```

### 6. Verification
```typescript
// Validate success
const verification = await verify(incident);
// Tests function, checks metrics, validates improvement
```

### 7. Audit Trail
```typescript
// Every action logged to DynamoDB
await dynamodb.logAudit({
  incidentId,
  action: 'remediation_executed',
  result: 'success',
  details: { /* full context */ }
});
```

## 📊 Dashboard Features

- **Incident List**: View all incidents with severity and status
- **Real-time Status**: Track investigation and remediation progress
- **Audit Trail**: Complete history of all actions taken
- **Metrics Visualization**: View CloudWatch metrics inline
- **Manual Intervention**: Approve or override AI decisions

## 🛡️ Safety Features

### Guardrails
- **Rate Limiting**: Prevents too many changes in short time
- **Resource Limits**: Validates changes stay within AWS limits
- **Dependency Checks**: Verifies downstream services won't break
- **Rollback Plans**: Every action has a rollback procedure

### Approval Workflow
```typescript
if (plan.approvalRequired) {
  // Send notification for human review
  await notifyOperator(plan);
  await waitForApproval();
}
```

### Rollback Capability
```typescript
if (!execution.success) {
  await executeRollback(action.rollbackPlan);
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- cloudwatch.test.ts

# Coverage report
npm test -- --coverage
```

## 📝 Example Scenarios

### Scenario 1: Lambda Timeout
```
Incident: Lambda function timing out
Investigation: High execution duration, memory near limit
Diagnosis: Insufficient memory allocation
Remediation: Increase memory from 256MB to 512MB
Verification: Test invocations succeed, duration improved
```

### Scenario 2: High Error Rate
```
Incident: API returning 500 errors
Investigation: Dependency timeout in logs
Diagnosis: Downstream service unreachable
Remediation: Add retry logic, increase timeout
Verification: Error rate drops below threshold
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 AWS Agentic AI Hackathon

This project was built for the AWS Agentic AI Hackathon to demonstrate:

1. **Agentic Workflows**: Multi-step reasoning with tool chaining
2. **Bedrock Integration**: Advanced use of Converse API with tools
3. **Real-world Application**: Production-ready incident response
4. **Cloud Native**: Fully leverages AWS services
5. **Safety & Compliance**: Guardrails and audit trails

## 🔗 Related Links

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic Claude](https://www.anthropic.com/claude)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [CloudWatch Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for AWS Agentic AI Hackathon**
