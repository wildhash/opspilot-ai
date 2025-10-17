/**
 * AWS Bedrock integration for AI-powered diagnosis
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput,
  ConverseCommandOutput,
  ContentBlock,
  Message as BedrockMessage
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockRequest, Message, ToolUse, ToolResult, ToolConfiguration, IncidentContext, ActionPlan } from '../types';
import { DynamoDBService } from './dynamodb';

export class BedrockService {
  private client: BedrockRuntimeClient;
  private defaultModelId: string;
  private dynamodb: DynamoDBService;

  constructor(region: string = 'us-east-1', modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0') {
    this.client = new BedrockRuntimeClient({ region });
    this.defaultModelId = modelId;
    this.dynamodb = new DynamoDBService(region);
  }

  /**
   * Send a message to Bedrock and get a response
   */
  async converse(request: BedrockRequest): Promise<ConverseCommandOutput> {
    const input: ConverseCommandInput = {
      modelId: request.modelId || this.defaultModelId,
      messages: this.formatMessages(request.messages),
      inferenceConfig: {
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 4096
      }
    };

    if (request.toolConfig) {
      input.toolConfig = this.formatToolConfig(request.toolConfig);
    }

    const command = new ConverseCommand(input);
    return await this.client.send(command);
  }

  /**
   * Format messages for Bedrock API
   */
  private formatMessages(messages: Message[]): BedrockMessage[] {
    return messages.map(msg => {
      let content: ContentBlock[];
      
      if (typeof msg.content === 'string') {
        content = [{ text: msg.content }];
      } else if (Array.isArray(msg.content)) {
        content = msg.content.map(item => {
          if ('toolUseId' in item && 'name' in item) {
            // ToolUse
            return {
              toolUse: {
                toolUseId: item.toolUseId,
                name: item.name,
                input: item.input as Record<string, any>
              }
            };
          } else {
            // ToolResult
            return {
              toolResult: {
                toolUseId: item.toolUseId,
                content: [{ json: item.content }],
                status: item.status || 'success'
              }
            };
          }
        });
      } else {
        content = [{ text: String(msg.content) }];
      }

      return {
        role: msg.role,
        content
      };
    });
  }

  /**
   * Format tool configuration for Bedrock API
   */
  private formatToolConfig(toolConfig: ToolConfiguration): any {
    return {
      tools: toolConfig.tools.map(tool => ({
        toolSpec: {
          name: tool.toolSpec.name,
          description: tool.toolSpec.description,
          inputSchema: {
            json: tool.toolSpec.inputSchema.json
          }
        }
      })),
      toolChoice: toolConfig.toolChoice || { auto: {} }
    };
  }

  /**
   * Diagnose an incident using AI
   */
  async diagnoseIncident(
    incidentDescription: string,
    metrics: Record<string, any>,
    logs: string[],
    tools?: ToolConfiguration
  ): Promise<string> {
    const systemPrompt = `You are OpsPilot AI, an expert AWS incident response agent. 
Analyze the provided incident data, metrics, and logs to diagnose the root cause.
Provide a clear, actionable diagnosis with high confidence based on the evidence.`;

    const userMessage = `Incident: ${incidentDescription}

Metrics:
${JSON.stringify(metrics, null, 2)}

Recent Error Logs:
${logs.slice(0, 10).join('\n')}

Please diagnose the root cause and provide:
1. Primary root cause
2. Confidence level (0-1)
3. Affected components
4. Recommended remediation approach`;

    const request: BedrockRequest = {
      modelId: this.defaultModelId,
      messages: [
        { role: 'user', content: systemPrompt },
        { role: 'assistant', content: 'I understand. I will analyze AWS incidents and provide expert diagnosis.' },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      maxTokens: 2048
    };

    if (tools) {
      request.toolConfig = tools;
    }

    const response = await this.converse(request);
    return this.extractTextFromResponse(response);
  }

  /**
   * Generate a remediation plan using AI
   */
  async generateRemediationPlan(
    diagnosis: string,
    resourceArn: string,
    currentConfig: Record<string, any>
  ): Promise<string> {
    const prompt = `Based on the following diagnosis, generate a safe remediation plan:

Diagnosis: ${diagnosis}
Resource ARN: ${resourceArn}
Current Configuration:
${JSON.stringify(currentConfig, null, 2)}

Generate a remediation plan that includes:
1. Specific actions to take (in order)
2. Safety guardrails and checks
3. Rollback procedures
4. Expected impact and risks
5. Whether human approval is required

Focus on safe, incremental changes that can be automatically executed.`;

    const request: BedrockRequest = {
      modelId: this.defaultModelId,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      maxTokens: 2048
    };

    const response = await this.converse(request);
    return this.extractTextFromResponse(response);
  }

  /**
   * Execute agentic workflow with tool use
   */
  async executeAgenticWorkflow(
    initialPrompt: string,
    tools: ToolConfiguration,
    maxIterations: number = 10
  ): Promise<{
    finalResponse: string;
    toolCalls: Array<{ tool: string; input: any; output: any }>;
    iterations: number;
  }> {
    const messages: Message[] = [
      { role: 'user', content: initialPrompt }
    ];

    const toolCalls: Array<{ tool: string; input: any; output: any }> = [];
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const request: BedrockRequest = {
        modelId: this.defaultModelId,
        messages,
        toolConfig: tools,
        temperature: 0.5
      };

      const response = await this.converse(request);
      
      if (!response.output?.message) {
        break;
      }

      const content = response.output.message.content;
      if (!content) break;

      // Check if there are tool uses
      const toolUses: ToolUse[] = [];
      let hasText = false;

      for (const block of content) {
        if (block.toolUse) {
          toolUses.push({
            toolUseId: block.toolUse.toolUseId || '',
            name: block.toolUse.name || '',
            input: (block.toolUse.input as Record<string, any>) || {}
          });
        }
        if (block.text) {
          hasText = true;
        }
      }

      // Add assistant message
      messages.push({
        role: 'assistant',
        content: toolUses.length > 0 ? toolUses : this.extractTextFromContent(content)
      });

      // If no tool uses, we're done
      if (toolUses.length === 0) {
        break;
      }

      // Execute tools and add results (in real implementation, this would call actual tools)
      const toolResults: ToolResult[] = toolUses.map(toolUse => {
        const mockOutput = { success: true, data: `Executed ${toolUse.name}` };
        toolCalls.push({ tool: toolUse.name, input: toolUse.input, output: mockOutput });
        
        return {
          toolUseId: toolUse.toolUseId,
          content: mockOutput,
          status: 'success'
        };
      });

      messages.push({
        role: 'user',
        content: toolResults
      });
    }

    const finalResponse = messages[messages.length - 1].role === 'assistant' 
      ? String(messages[messages.length - 1].content)
      : 'Workflow completed';

    return {
      finalResponse,
      toolCalls,
      iterations
    };
  }

  /**
   * Extract text from Bedrock response
   */
  private extractTextFromResponse(response: ConverseCommandOutput): string {
    const content = response.output?.message?.content;
    if (!content) return '';
    return this.extractTextFromContent(content);
  }

  /**
   * Extract text from content blocks
   */
  private extractTextFromContent(content: ContentBlock[]): string {
    return content
      .filter(block => block.text)
      .map(block => block.text)
      .join('\n');
  }

  /**
   * Build prompt for incident remediation planning
   */
  private buildPrompt(ctx: IncidentContext): string {
    return `You are OpsPilot, an expert AWS incident response planner.

CRITICAL INSTRUCTIONS:
- Analyze the provided metrics and configuration to identify the root cause
- Generate a MINIMAL, SAFE remediation plan
- Return ONLY valid JSON matching the ActionPlan schema below
- Do not include any explanatory text, only the JSON object

INCIDENT DESCRIPTION:
${ctx.incidentText}

CURRENT FUNCTION CONFIGURATION:
${JSON.stringify(ctx.functionConfig, null, 2)}

RECENT PERFORMANCE METRICS (15min window):
${JSON.stringify(ctx.metrics, null, 2)}

RECENT ERROR SAMPLES:
${JSON.stringify(ctx.recentErrors.slice(0, 5), null, 2)}

SAFETY CONSTRAINTS:
- Maximum memory: ${ctx.constraints.maxMemoryMB} MB
- Maximum timeout: ${ctx.constraints.maxTimeoutSec} seconds
- Allowed regions: ${ctx.constraints.regionAllowlist.join(', ')}
- Verification required: ${ctx.constraints.requireVerify}

ACTIONPLAN SCHEMA:
{
  "intent": "reduce_timeouts" | "reduce_5xx" | "reduce_latency" | "stabilize_concurrency",
  "changes": {
    "lambda": {
      "memoryMb"?: number (128-${ctx.constraints.maxMemoryMB}),
      "timeoutSec"?: number (3-${ctx.constraints.maxTimeoutSec}),
      "reservedConcurrency"?: number | null
    },
    "alarms"?: [
      {
        "metric": "Errors" | "Duration",
        "threshold": number,
        "periodSec": number
      }
    ]
  },
  "verify": {
    "invokeTest": boolean,
    "successCriteria": string
  },
  "rollbackCriteria": string,
  "notes": string
}

ANALYSIS GUIDELINES:
- If Duration is high and memory is low → increase memory
- If timeouts are occurring → increase timeout duration
- If errors are persistent → investigate concurrency limits
- Always add appropriate CloudWatch alarms for monitoring
- Keep changes minimal and reversible

Return ONLY the JSON ActionPlan object, no other text.`;
  }

  /**
   * Plan remediation for an incident
   */
  async planRemediation(ctx: IncidentContext, useCache: boolean = true): Promise<{ plan: ActionPlan; cached: boolean }> {
    // Try cache first for demo reliability
    if (useCache) {
      const cached = await this.dynamodb.getCachedPlan();
      if (cached) {
        console.log('Using cached plan for reliability');
        return { plan: cached, cached: true };
      }
    }

    // Build prompt
    const prompt = this.buildPrompt(ctx);

    // Call Bedrock
    const request: BedrockRequest = {
      modelId: this.defaultModelId,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      maxTokens: 2048
    };

    const response = await this.converse(request);
    const responseText = this.extractTextFromResponse(response);

    // Parse JSON response
    let plan: ActionPlan;
    try {
      // Extract JSON from response (handle cases where model adds markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      plan = JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse Bedrock response as JSON: ${error}`);
    }

    // Cache successful plan
    await this.dynamodb.cachePlan(plan);
    return { plan, cached: false };
  }
}
