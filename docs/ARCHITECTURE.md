# Architecture Overview

## System Components

### 1. OpsPilot Agent (Core)
The central orchestrator that manages the entire incident response lifecycle.

**Key Responsibilities:**
- Incident ingestion and tracking
- Tool coordination and execution
- State management
- Safety enforcement
- Audit logging

**Workflow:**
```
Incident → Investigate → Diagnose → Plan → Execute → Verify → Audit
```

### 2. AWS Service Integrations

#### CloudWatch Service
**Purpose**: Observability and metrics analysis

**Features:**
- Metric retrieval with custom time ranges
- Log querying with pattern matching
- Anomaly detection using statistical methods
- Multi-metric analysis

**Usage:**
```typescript
const cw = new CloudWatchService('us-east-1');
const metrics = await cw.getLambdaMetrics(functionName, startTime, endTime);
const logs = await cw.queryLogs(logGroup, startTime, endTime, 'ERROR');
```

#### Bedrock Service
**Purpose**: AI-powered analysis and decision making

**Features:**
- Incident diagnosis using Claude 3
- Remediation plan generation
- Agentic workflows with tool use
- Multi-turn conversations

**Models Supported:**
- Claude 3 Sonnet (default)
- Claude 3 Haiku (fast inference)
- Claude 3 Opus (complex reasoning)

**Tool Use Example:**
```typescript
const tools = {
  tools: [
    {
      toolSpec: {
        name: 'get_metrics',
        description: 'Retrieve CloudWatch metrics',
        inputSchema: { /* JSON Schema */ }
      }
    }
  ]
};

const result = await bedrock.executeAgenticWorkflow(prompt, tools);
```

#### Lambda Service
**Purpose**: Lambda function management and testing

**Features:**
- Configuration updates
- Function invocation (sync/async/dry-run)
- Health checks
- Batch testing

**Safety:**
- Validates changes before applying
- Supports rollback
- Tests changes before production

#### DynamoDB Service
**Purpose**: State persistence and audit trails

**Tables:**
1. **AuditTrail**: All actions with timestamps
2. **Incidents**: Incident metadata and status
3. **RemediationPlans**: Generated plans and results

**Indexes:**
- IncidentIdIndex: Query all actions for an incident
- StatusIndex: Find incidents by status

### 3. Lambda Handler
**Purpose**: Serverless execution entry point

**Deployment:**
- Deployed as AWS Lambda function
- Triggered by incidents (manual, EventBridge, SNS)
- Timeout: 5 minutes (configurable)
- Memory: 512 MB (configurable)

**Environment Variables:**
- `AWS_REGION`: AWS region
- `AUDIT_TABLE_NAME`: DynamoDB audit table
- `INCIDENTS_TABLE_NAME`: Incidents table
- `PLANS_TABLE_NAME`: Plans table

### 4. Frontend Dashboard
**Purpose**: Monitoring and control interface

**Features:**
- Real-time incident dashboard
- Incident creation form
- Status tracking
- Audit trail viewer

**Tech Stack:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript

## Data Flow

### Incident Processing Flow

```
1. Incident Created
   ↓
2. Save to DynamoDB (status: open)
   ↓
3. Update status: investigating
   ↓
4. Gather CloudWatch metrics
   ↓
5. Query CloudWatch logs
   ↓
6. Get resource configuration
   ↓
7. Send to Bedrock for diagnosis
   ↓
8. Generate remediation plan
   ↓
9. Perform safety checks
   ↓
10. Execute actions (if safe)
   ↓
11. Update status: remediating
   ↓
12. Verify success
   ↓
13. Update status: resolved/failed
   ↓
14. Log all actions to audit trail
```

### Tool Chaining Flow

```
User Prompt
   ↓
Bedrock Converse API
   ↓
Tool Use Request
   ↓
Execute Tool (CloudWatch, Lambda, etc.)
   ↓
Return Tool Result
   ↓
Bedrock Processes Result
   ↓
Next Tool Use OR Final Response
```

## Security Model

### IAM Permissions

**Lambda Execution Role:**
- `bedrock:InvokeModel`
- `cloudwatch:GetMetricData`
- `logs:FilterLogEvents`
- `lambda:GetFunction*`
- `lambda:UpdateFunctionConfiguration`
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Query`

### Safety Checks

1. **Rate Limiting**: Max 5 actions per incident
2. **Resource Limits**: Stay within AWS quotas
3. **Approval Required**: High-risk changes need human approval
4. **Rollback Available**: Every action has a rollback plan

### Audit Trail

Every action is logged with:
- Timestamp
- Actor (system/user)
- Action type
- Input parameters
- Result (success/failure)
- Error details (if failed)

## Scalability

### Current Limits
- Lambda: 5-minute timeout
- DynamoDB: Pay-per-request (auto-scaling)
- Bedrock: Model-specific rate limits

### Scaling Considerations
- Use Step Functions for workflows > 5 minutes
- Implement DynamoDB Global Tables for multi-region
- Add SQS for high-volume incident ingestion
- Use Lambda Destinations for error handling

## Monitoring

### CloudWatch Metrics to Monitor
- `OpsPilotInvocations`: Total invocations
- `OpsPilotErrors`: Error count
- `OpsPilotDuration`: Execution time
- `IncidentsProcessed`: Incidents handled
- `IncidentsResolved`: Successfully resolved
- `ActionsExecuted`: Remediation actions taken

### Alarms
- High error rate (> 5%)
- Long execution time (> 4 minutes)
- Failed verifications (> 2 consecutive)

## Future Enhancements

1. **Multi-Resource Support**: Expand beyond Lambda to ECS, EC2, RDS
2. **Learning from History**: Use past incidents to improve diagnosis
3. **Predictive Monitoring**: Detect issues before they become incidents
4. **Integration Hub**: Connect with PagerDuty, Slack, Jira
5. **Cost Optimization**: Suggest cost-saving measures during remediation
6. **Compliance Reporting**: Generate compliance reports from audit trail
