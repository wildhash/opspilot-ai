# API Reference

## Core Classes

### OpsPilotAgent

Main orchestrator for incident response workflows.

#### Constructor

```typescript
new OpsPilotAgent(region?: string)
```

**Parameters:**
- `region` (optional): AWS region, defaults to 'us-east-1'

#### Methods

##### handleIncident()

Process an incident through the complete workflow.

```typescript
async handleIncident(incident: Incident): Promise<{
  diagnosis: DiagnosisResult;
  plan: RemediationPlan;
  executionResults: ExecutionResult[];
  verification: VerificationResult;
}>
```

**Parameters:**
- `incident`: Incident object with details

**Returns:** Complete incident response results

**Example:**
```typescript
const agent = new OpsPilotAgent('us-east-1');
const result = await agent.handleIncident({
  id: 'inc-001',
  severity: 'high',
  resourceArn: 'arn:aws:lambda:...',
  resourceType: 'lambda',
  description: 'High error rate',
  status: 'open',
  timestamp: new Date()
});
```

##### investigate()

Gather data and analyze the incident.

```typescript
async investigate(incident: Incident): Promise<DiagnosisResult>
```

##### generateRemediationPlan()

Create a remediation plan with safety checks.

```typescript
async generateRemediationPlan(
  incident: Incident,
  diagnosis: DiagnosisResult
): Promise<RemediationPlan>
```

##### executeRemediation()

Execute remediation actions.

```typescript
async executeRemediation(
  incident: Incident,
  plan: RemediationPlan
): Promise<ExecutionResult[]>
```

##### verify()

Verify that remediation was successful.

```typescript
async verify(incident: Incident): Promise<VerificationResult>
```

---

### CloudWatchService

AWS CloudWatch integration for metrics and logs.

#### Constructor

```typescript
new CloudWatchService(region?: string)
```

#### Methods

##### getMetrics()

Fetch CloudWatch metrics.

```typescript
async getMetrics(
  namespace: string,
  metricName: string,
  dimensions: Record<string, string>,
  startTime: Date,
  endTime: Date,
  period?: number
): Promise<MetricData>
```

**Example:**
```typescript
const cw = new CloudWatchService('us-east-1');
const metrics = await cw.getMetrics(
  'AWS/Lambda',
  'Errors',
  { FunctionName: 'my-function' },
  new Date(Date.now() - 3600000),
  new Date()
);
```

##### queryLogs()

Query CloudWatch Logs with filtering.

```typescript
async queryLogs(
  logGroupName: string,
  startTime: Date,
  endTime: Date,
  filterPattern?: string,
  limit?: number
): Promise<LogEntry[]>
```

**Example:**
```typescript
const logs = await cw.queryLogs(
  '/aws/lambda/my-function',
  new Date(Date.now() - 3600000),
  new Date(),
  'ERROR',
  100
);
```

##### getLambdaMetrics()

Get all standard Lambda metrics at once.

```typescript
async getLambdaMetrics(
  functionName: string,
  startTime: Date,
  endTime: Date
): Promise<Record<string, MetricData>>
```

##### analyzeMetricAnomalies()

Detect anomalies using statistical analysis.

```typescript
async analyzeMetricAnomalies(
  metricData: MetricData,
  threshold?: number
): Promise<{
  hasAnomaly: boolean;
  anomalies: Array<{ timestamp: Date; value: number; zscore: number }>;
}>
```

---

### BedrockService

AWS Bedrock integration for AI capabilities.

#### Constructor

```typescript
new BedrockService(
  region?: string,
  modelId?: string
)
```

**Parameters:**
- `region`: AWS region
- `modelId`: Bedrock model ID (default: Claude 3 Sonnet)

#### Methods

##### converse()

Send a message to Bedrock using Converse API.

```typescript
async converse(request: BedrockRequest): Promise<ConverseCommandOutput>
```

**Example:**
```typescript
const bedrock = new BedrockService('us-east-1');
const response = await bedrock.converse({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  messages: [
    { role: 'user', content: 'Analyze this error...' }
  ],
  temperature: 0.7
});
```

##### diagnoseIncident()

Use AI to diagnose an incident.

```typescript
async diagnoseIncident(
  incidentDescription: string,
  metrics: Record<string, any>,
  logs: string[],
  tools?: ToolConfiguration
): Promise<string>
```

##### generateRemediationPlan()

Generate a remediation plan using AI.

```typescript
async generateRemediationPlan(
  diagnosis: string,
  resourceArn: string,
  currentConfig: Record<string, any>
): Promise<string>
```

##### executeAgenticWorkflow()

Run a multi-step agentic workflow with tool use.

```typescript
async executeAgenticWorkflow(
  initialPrompt: string,
  tools: ToolConfiguration,
  maxIterations?: number
): Promise<{
  finalResponse: string;
  toolCalls: Array<{ tool: string; input: any; output: any }>;
  iterations: number;
}>
```

**Example:**
```typescript
const tools: ToolConfiguration = {
  tools: [
    {
      toolSpec: {
        name: 'get_metrics',
        description: 'Get CloudWatch metrics',
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
  'Investigate high error rate in Lambda function',
  tools,
  10
);
```

---

### LambdaService

AWS Lambda management and testing.

#### Constructor

```typescript
new LambdaService(region?: string)
```

#### Methods

##### getFunctionConfig()

Get Lambda function configuration.

```typescript
async getFunctionConfig(functionName: string): Promise<any>
```

##### updateFunctionConfig()

Update Lambda function configuration.

```typescript
async updateFunctionConfig(
  functionName: string,
  updates: {
    timeout?: number;
    memorySize?: number;
    environment?: Record<string, string>;
  }
): Promise<any>
```

**Example:**
```typescript
const lambda = new LambdaService('us-east-1');
await lambda.updateFunctionConfig('my-function', {
  timeout: 30,
  memorySize: 512
});
```

##### invokeFunction()

Invoke a Lambda function.

```typescript
async invokeFunction(
  functionName: string,
  payload: any,
  invocationType?: 'RequestResponse' | 'Event' | 'DryRun'
): Promise<{
  statusCode: number;
  payload: any;
  executedVersion?: string;
  functionError?: string;
}>
```

##### testFunction()

Run multiple test invocations.

```typescript
async testFunction(
  functionName: string,
  testPayloads: any[],
  concurrency?: number
): Promise<{
  totalTests: number;
  successful: number;
  failed: number;
  results: Array<{ success: boolean; duration?: number; error?: string }>;
}>
```

##### checkFunctionHealth()

Perform health check on Lambda function.

```typescript
async checkFunctionHealth(functionName: string): Promise<{
  healthy: boolean;
  issues: string[];
}>
```

---

### DynamoDBService

DynamoDB integration for audit trail and state.

#### Constructor

```typescript
new DynamoDBService(
  region?: string,
  tableName?: string
)
```

#### Methods

##### logAudit()

Log an audit entry.

```typescript
async logAudit(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry>
```

**Example:**
```typescript
const dynamodb = new DynamoDBService('us-east-1');
await dynamodb.logAudit({
  incidentId: 'inc-001',
  timestamp: new Date(),
  action: 'diagnosis_completed',
  actor: 'system',
  details: { rootCause: 'Memory exhaustion' },
  result: 'success'
});
```

##### getAuditTrail()

Get all audit entries for an incident.

```typescript
async getAuditTrail(incidentId: string): Promise<AuditEntry[]>
```

##### saveIncident()

Save an incident to DynamoDB.

```typescript
async saveIncident(incident: Incident): Promise<void>
```

##### updateIncidentStatus()

Update incident status.

```typescript
async updateIncidentStatus(
  incidentId: string,
  status: Incident['status'],
  details?: Record<string, any>
): Promise<void>
```

##### getOpenIncidents()

Get all open incidents.

```typescript
async getOpenIncidents(): Promise<Incident[]>
```

---

## Types

### Incident

```typescript
interface Incident {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resourceArn: string;
  resourceType: 'lambda' | 'ecs' | 'ec2' | 'rds';
  description: string;
  metrics?: Record<string, number>;
  logs?: string[];
  status: 'open' | 'investigating' | 'remediating' | 'resolved' | 'failed';
}
```

### DiagnosisResult

```typescript
interface DiagnosisResult {
  rootCause: string;
  confidence: number;
  affectedComponents: string[];
  relatedMetrics: string[];
  reasoning: string;
  timestamp: Date;
}
```

### RemediationPlan

```typescript
interface RemediationPlan {
  id: string;
  incidentId: string;
  actions: RemediationAction[];
  estimatedImpact: string;
  safetyChecks: SafetyCheck[];
  approvalRequired: boolean;
  createdAt: Date;
}
```

### RemediationAction

```typescript
interface RemediationAction {
  id: string;
  type: 'update_config' | 'restart_service' | 'scale_resources' | 'rollback' | 'custom';
  description: string;
  parameters: Record<string, any>;
  rollbackPlan?: RemediationAction[];
  order: number;
}
```

---

## CLI Commands

### test-incident

Test OpsPilot with a sample incident.

```bash
npm run cli test-incident [arn]
```

**Options:**
- `arn` (optional): Lambda function ARN

**Example:**
```bash
npm run cli test-incident
npm run cli test-incident arn:aws:lambda:us-east-1:123:function:my-func
```

### list-incidents

List all open incidents.

```bash
npm run cli list-incidents
```

### help

Display help information.

```bash
npm run cli help
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | us-east-1 |
| `AUDIT_TABLE_NAME` | DynamoDB audit table name | OpsPilotAuditTrail |
| `INCIDENTS_TABLE_NAME` | DynamoDB incidents table name | OpsPilotAuditTrail-Incidents |
| `PLANS_TABLE_NAME` | DynamoDB plans table name | OpsPilotAuditTrail-Plans |
| `LOG_LEVEL` | Logging level | info |

---

## Error Handling

All methods throw errors that should be caught:

```typescript
try {
  const result = await agent.handleIncident(incident);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

---

## Rate Limits

Be aware of AWS service limits:

- **Bedrock**: Model-specific rate limits
- **CloudWatch**: 400 transactions per second per account
- **Lambda**: 1000 concurrent executions (default)
- **DynamoDB**: Based on billing mode

---

## Best Practices

1. **Always use try-catch** for error handling
2. **Set appropriate timeouts** for long-running operations
3. **Monitor costs** when using Bedrock extensively
4. **Use pagination** for large result sets
5. **Enable CloudWatch Logs** for debugging
6. **Test in non-production** environments first
7. **Review audit trails** regularly
8. **Set up alarms** for critical failures
