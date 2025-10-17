/**
 * Core types for OpsPilot AI system
 */

export interface Incident {
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

export interface MetricData {
  metricName: string;
  namespace: string;
  dimensions: Record<string, string>;
  timestamps: Date[];
  values: number[];
  unit: string;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  requestId?: string;
}

export interface DiagnosisResult {
  rootCause: string;
  confidence: number;
  affectedComponents: string[];
  relatedMetrics: string[];
  reasoning: string;
  timestamp: Date;
}

export interface RemediationPlan {
  id: string;
  incidentId: string;
  actions: RemediationAction[];
  estimatedImpact: string;
  safetyChecks: SafetyCheck[];
  approvalRequired: boolean;
  createdAt: Date;
}

export interface RemediationAction {
  id: string;
  type: 'update_config' | 'restart_service' | 'scale_resources' | 'rollback' | 'custom';
  description: string;
  parameters: Record<string, any>;
  rollbackPlan?: RemediationAction[];
  order: number;
}

export interface SafetyCheck {
  type: 'rate_limit' | 'resource_limit' | 'dependency_check' | 'rollback_available';
  description: string;
  passed: boolean;
  details?: string;
}

export interface ExecutionResult {
  actionId: string;
  success: boolean;
  executedAt: Date;
  output?: any;
  error?: string;
  rollbackExecuted?: boolean;
}

export interface VerificationResult {
  success: boolean;
  timestamp: Date;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  metricsImproved: boolean;
}

export interface AuditEntry {
  id: string;
  incidentId: string;
  timestamp: Date;
  action: string;
  actor: 'system' | 'user';
  details: Record<string, any>;
  result: 'success' | 'failure';
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface AgentContext {
  incident: Incident;
  tools: Tool[];
  memory: Record<string, any>;
  maxIterations: number;
  currentIteration: number;
}

export interface BedrockRequest {
  modelId: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  toolConfig?: ToolConfiguration;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ToolUse[] | ToolResult[];
}

export interface ToolUse {
  toolUseId: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  toolUseId: string;
  content: any;
  status?: 'success' | 'error';
}

export interface ToolConfiguration {
  tools: ToolDefinition[];
  toolChoice?: 'auto' | 'any' | { tool: { name: string } };
}

export interface ToolDefinition {
  toolSpec: {
    name: string;
    description: string;
    inputSchema: {
      json: Record<string, any>;
    };
  };
}
