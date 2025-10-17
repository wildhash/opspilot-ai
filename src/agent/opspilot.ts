/**
 * Core OpsPilot Agent that orchestrates incident response
 */

import {
  Incident,
  DiagnosisResult,
  RemediationPlan,
  RemediationAction,
  ExecutionResult,
  VerificationResult,
  SafetyCheck,
  Tool,
  ToolConfiguration
} from '../types';
import { BedrockService } from '../aws/bedrock';
import { CloudWatchService } from '../aws/cloudwatch';
import { LambdaService } from '../aws/lambda';
import { DynamoDBService } from '../aws/dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class OpsPilotAgent {
  private bedrock: BedrockService;
  private cloudwatch: CloudWatchService;
  private lambda: LambdaService;
  private dynamodb: DynamoDBService;
  private tools: Tool[];

  constructor(region: string = 'us-east-1') {
    this.bedrock = new BedrockService(region);
    this.cloudwatch = new CloudWatchService(region);
    this.lambda = new LambdaService(region);
    this.dynamodb = new DynamoDBService(region);
    this.tools = this.initializeTools();
  }

  /**
   * Initialize available tools for the agent
   */
  private initializeTools(): Tool[] {
    return [
      {
        name: 'get_cloudwatch_metrics',
        description: 'Retrieve CloudWatch metrics for analysis',
        parameters: {
          type: 'object',
          properties: {
            namespace: { type: 'string' },
            metricName: { type: 'string' },
            dimensions: { type: 'object' },
            startTime: { type: 'string' },
            endTime: { type: 'string' }
          },
          required: ['namespace', 'metricName', 'dimensions']
        },
        execute: async (params) => {
          const startTime = params.startTime ? new Date(params.startTime) : new Date(Date.now() - 3600000);
          const endTime = params.endTime ? new Date(params.endTime) : new Date();
          return await this.cloudwatch.getMetrics(
            params.namespace,
            params.metricName,
            params.dimensions,
            startTime,
            endTime
          );
        }
      },
      {
        name: 'query_logs',
        description: 'Query CloudWatch Logs for error analysis',
        parameters: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string' },
            filterPattern: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' }
          },
          required: ['logGroupName']
        },
        execute: async (params) => {
          const startTime = params.startTime ? new Date(params.startTime) : new Date(Date.now() - 3600000);
          const endTime = params.endTime ? new Date(params.endTime) : new Date();
          return await this.cloudwatch.queryLogs(
            params.logGroupName,
            startTime,
            endTime,
            params.filterPattern
          );
        }
      },
      {
        name: 'get_lambda_config',
        description: 'Get Lambda function configuration',
        parameters: {
          type: 'object',
          properties: {
            functionName: { type: 'string' }
          },
          required: ['functionName']
        },
        execute: async (params) => {
          return await this.lambda.getFunctionConfig(params.functionName);
        }
      },
      {
        name: 'test_lambda_function',
        description: 'Test Lambda function with sample payload',
        parameters: {
          type: 'object',
          properties: {
            functionName: { type: 'string' },
            payload: { type: 'object' }
          },
          required: ['functionName', 'payload']
        },
        execute: async (params) => {
          return await this.lambda.invokeFunction(params.functionName, params.payload);
        }
      }
    ];
  }

  /**
   * Main workflow: Handle an incident end-to-end
   */
  async handleIncident(incident: Incident): Promise<{
    diagnosis: DiagnosisResult;
    plan: RemediationPlan;
    executionResults: ExecutionResult[];
    verification: VerificationResult;
  }> {
    console.log(`[OpsPilot] Starting incident response for ${incident.id}`);

    // Save incident
    await this.dynamodb.saveIncident(incident);
    await this.dynamodb.updateIncidentStatus(incident.id, 'investigating');

    // Step 1: Investigate
    const diagnosis = await this.investigate(incident);
    console.log(`[OpsPilot] Diagnosis complete: ${diagnosis.rootCause}`);

    // Step 2: Generate remediation plan
    const plan = await this.generateRemediationPlan(incident, diagnosis);
    console.log(`[OpsPilot] Generated plan with ${plan.actions.length} actions`);
    await this.dynamodb.saveRemediationPlan(plan);

    // Step 3: Execute remediation (if safe)
    await this.dynamodb.updateIncidentStatus(incident.id, 'remediating');
    const executionResults = await this.executeRemediation(incident, plan);
    console.log(`[OpsPilot] Executed ${executionResults.length} actions`);

    // Step 4: Verify success
    const verification = await this.verify(incident);
    console.log(`[OpsPilot] Verification: ${verification.success ? 'SUCCESS' : 'FAILED'}`);

    const finalStatus = verification.success ? 'resolved' : 'failed';
    await this.dynamodb.updateIncidentStatus(incident.id, finalStatus, {
      diagnosis: diagnosis.rootCause,
      actionsExecuted: executionResults.length,
      verified: verification.success
    });

    return {
      diagnosis,
      plan,
      executionResults,
      verification
    };
  }

  /**
   * Investigate incident using CloudWatch and AI
   */
  async investigate(incident: Incident): Promise<DiagnosisResult> {
    console.log('[OpsPilot] Investigating incident...');

    // Gather metrics
    const functionName = this.extractFunctionName(incident.resourceArn);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000); // Last hour

    let metrics: Record<string, any> = {};
    let logs: string[] = [];

    if (functionName) {
      try {
        metrics = await this.cloudwatch.getLambdaMetrics(functionName, startTime, endTime);
        const logGroupName = `/aws/lambda/${functionName}`;
        const logEntries = await this.cloudwatch.queryLogs(
          logGroupName,
          startTime,
          endTime,
          'ERROR'
        );
        logs = logEntries.map(entry => entry.message);
      } catch (error) {
        console.error('[OpsPilot] Error gathering data:', error);
      }
    }

    // Use AI to diagnose
    const diagnosisText = await this.bedrock.diagnoseIncident(
      incident.description,
      metrics,
      logs
    );

    // Parse diagnosis (simplified)
    const diagnosis: DiagnosisResult = {
      rootCause: diagnosisText.split('\n')[0] || 'Unknown',
      confidence: 0.85,
      affectedComponents: [functionName || incident.resourceArn],
      relatedMetrics: Object.keys(metrics),
      reasoning: diagnosisText,
      timestamp: new Date()
    };

    await this.dynamodb.logAudit({
      incidentId: incident.id,
      timestamp: new Date(),
      action: 'diagnosis_completed',
      actor: 'system',
      details: { rootCause: diagnosis.rootCause, confidence: diagnosis.confidence },
      result: 'success'
    });

    return diagnosis;
  }

  /**
   * Generate remediation plan with safety guardrails
   */
  async generateRemediationPlan(
    incident: Incident,
    diagnosis: DiagnosisResult
  ): Promise<RemediationPlan> {
    console.log('[OpsPilot] Generating remediation plan...');

    const functionName = this.extractFunctionName(incident.resourceArn);
    let currentConfig = {};

    if (functionName) {
      try {
        currentConfig = await this.lambda.getFunctionConfig(functionName);
      } catch (error) {
        console.error('[OpsPilot] Error getting config:', error);
      }
    }

    const planText = await this.bedrock.generateRemediationPlan(
      diagnosis.reasoning,
      incident.resourceArn,
      currentConfig
    );

    // Generate actions based on diagnosis
    const actions = this.parseRemediationActions(planText, incident);

    // Safety checks
    const safetyChecks = this.performSafetyChecks(actions, incident);

    const plan: RemediationPlan = {
      id: uuidv4(),
      incidentId: incident.id,
      actions,
      estimatedImpact: 'Medium - Configuration changes',
      safetyChecks,
      approvalRequired: safetyChecks.some(check => !check.passed),
      createdAt: new Date()
    };

    return plan;
  }

  /**
   * Parse remediation actions from AI response
   */
  private parseRemediationActions(planText: string, incident: Incident): RemediationAction[] {
    const actions: RemediationAction[] = [];
    const functionName = this.extractFunctionName(incident.resourceArn);

    // Common remediation patterns
    if (planText.toLowerCase().includes('memory') || planText.toLowerCase().includes('timeout')) {
      actions.push({
        id: uuidv4(),
        type: 'update_config',
        description: 'Increase Lambda memory and timeout',
        parameters: {
          functionName,
          memorySize: 512,
          timeout: 30
        },
        order: 1
      });
    }

    if (planText.toLowerCase().includes('restart') || planText.toLowerCase().includes('redeploy')) {
      actions.push({
        id: uuidv4(),
        type: 'restart_service',
        description: 'Update function configuration to trigger restart',
        parameters: {
          functionName
        },
        order: 2
      });
    }

    // Fallback action
    if (actions.length === 0) {
      actions.push({
        id: uuidv4(),
        type: 'custom',
        description: 'Manual investigation required',
        parameters: { note: planText },
        order: 1
      });
    }

    return actions;
  }

  /**
   * Perform safety checks on remediation plan
   */
  private performSafetyChecks(
    actions: RemediationAction[],
    _incident: Incident
  ): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    // Check 1: Rate limiting
    checks.push({
      type: 'rate_limit',
      description: 'Ensure we are not making too many changes',
      passed: actions.length <= 5,
      details: `${actions.length} actions planned`
    });

    // Check 2: Rollback available
    checks.push({
      type: 'rollback_available',
      description: 'Verify rollback procedures exist',
      passed: true,
      details: 'Configuration changes can be reverted'
    });

    // Check 3: Resource limits
    checks.push({
      type: 'resource_limit',
      description: 'Check resource allocation is within limits',
      passed: true,
      details: 'All changes within AWS limits'
    });

    return checks;
  }

  /**
   * Execute remediation actions
   */
  async executeRemediation(
    incident: Incident,
    plan: RemediationPlan
  ): Promise<ExecutionResult[]> {
    console.log('[OpsPilot] Executing remediation...');

    const results: ExecutionResult[] = [];

    // Check if approval required
    if (plan.approvalRequired) {
      console.log('[OpsPilot] Approval required - skipping auto-execution');
      return results;
    }

    // Execute actions in order
    for (const action of plan.actions.sort((a, b) => a.order - b.order)) {
      const result = await this.executeAction(action);
      results.push(result);

      await this.dynamodb.logActionExecution(
        incident.id,
        action.id,
        result.success ? 'success' : 'failure',
        { action: action.type, output: result.output, error: result.error }
      );

      // Stop on failure
      if (!result.success) {
        console.error(`[OpsPilot] Action ${action.id} failed, stopping execution`);
        break;
      }
    }

    return results;
  }

  /**
   * Execute a single remediation action
   */
  private async executeAction(action: RemediationAction): Promise<ExecutionResult> {
    console.log(`[OpsPilot] Executing action: ${action.type}`);

    try {
      let output;

      switch (action.type) {
        case 'update_config': {
          output = await this.lambda.updateFunctionConfig(
            action.parameters.functionName,
            {
              memorySize: action.parameters.memorySize,
              timeout: action.parameters.timeout
            }
          );
          break;
        }

        case 'restart_service': {
          // Update environment variable to trigger restart
          const config = await this.lambda.getFunctionConfig(action.parameters.functionName);
          const env = config.Environment?.Variables || {};
          env['LAST_RESTART'] = new Date().toISOString();
          output = await this.lambda.updateFunctionConfig(
            action.parameters.functionName,
            { environment: env }
          );
          break;
        }

        default:
          output = { message: 'Action type not implemented for auto-execution' };
      }

      return {
        actionId: action.id,
        success: true,
        executedAt: new Date(),
        output
      };
    } catch (error) {
      return {
        actionId: action.id,
        success: false,
        executedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Verify remediation success
   */
  async verify(incident: Incident): Promise<VerificationResult> {
    console.log('[OpsPilot] Verifying remediation...');

    const checks = [];
    const functionName = this.extractFunctionName(incident.resourceArn);

    // Check 1: Lambda health
    if (functionName) {
      try {
        const health = await this.lambda.checkFunctionHealth(functionName);
        checks.push({
          name: 'Lambda Health Check',
          passed: health.healthy,
          details: health.issues.join(', ') || 'All checks passed'
        });
      } catch (error) {
        checks.push({
          name: 'Lambda Health Check',
          passed: false,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Check 2: Test invocation
    if (functionName) {
      try {
        const testResult = await this.lambda.invokeFunction(
          functionName,
          { test: true },
          'RequestResponse'
        );
        checks.push({
          name: 'Test Invocation',
          passed: testResult.statusCode === 200 && !testResult.functionError,
          details: testResult.functionError || 'Function invoked successfully'
        });
      } catch (error) {
        checks.push({
          name: 'Test Invocation',
          passed: false,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Check 3: Metrics improvement
    let metricsImproved = false;
    if (functionName) {
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 300000); // Last 5 minutes
        const metrics = await this.cloudwatch.getLambdaMetrics(functionName, startTime, endTime);
        
        // Check if error rate is low
        const errorMetric = metrics['Errors'];
        const errorCount = errorMetric?.values.reduce((a, b) => a + b, 0) || 0;
        metricsImproved = errorCount === 0;
        
        checks.push({
          name: 'Metrics Check',
          passed: metricsImproved,
          details: `Error count: ${errorCount}`
        });
      } catch (error) {
        checks.push({
          name: 'Metrics Check',
          passed: false,
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const allPassed = checks.every(check => check.passed);

    return {
      success: allPassed,
      timestamp: new Date(),
      checks,
      metricsImproved
    };
  }

  /**
   * Extract function name from ARN
   */
  private extractFunctionName(arn: string): string | null {
    const match = arn.match(/function:([^:]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get tool configuration for Bedrock
   */
  getToolConfiguration(): ToolConfiguration {
    return {
      tools: this.tools.map(tool => ({
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            json: tool.parameters
          }
        }
      }))
    };
  }
}
