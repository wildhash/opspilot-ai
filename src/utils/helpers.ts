/**
 * Utility functions for OpsPilot
 */

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ARN to extract resource information
 */
export function parseArn(arn: string): {
  service: string;
  region: string;
  accountId: string;
  resourceType: string;
  resourceName: string;
} | null {
  const arnPattern = /^arn:aws:([^:]+):([^:]*):([^:]*):(.+)$/;
  const match = arn.match(arnPattern);
  
  if (!match) {
    return null;
  }

  const [, service, region, accountId, resource] = match;
  const [resourceType, ...resourceNameParts] = resource.split(/[/:]/);
  const resourceName = resourceNameParts.join('/');

  return {
    service,
    region,
    accountId,
    resourceType,
    resourceName
  };
}

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidence(
  metricsQuality: number,
  logsQuality: number,
  aiConfidence: number
): number {
  return (metricsQuality * 0.3 + logsQuality * 0.3 + aiConfidence * 0.4);
}

/**
 * Validate incident severity
 */
export function validateSeverity(severity: string): boolean {
  return ['critical', 'high', 'medium', 'low'].includes(severity);
}

/**
 * Generate summary for audit trail
 */
export function generateAuditSummary(actions: any[]): string {
  const summary = actions.map(action => 
    `${action.action} at ${formatDate(new Date(action.timestamp))}`
  ).join('; ');
  
  return summary || 'No actions recorded';
}

/**
 * Extract error message from logs
 */
export function extractErrorMessage(logs: string[]): string | null {
  for (const log of logs) {
    if (log.includes('ERROR') || log.includes('Error')) {
      // Extract the main error message
      const lines = log.split('\n');
      for (const line of lines) {
        if (line.includes('ERROR') || line.includes('Error')) {
          return line.trim();
        }
      }
    }
  }
  return null;
}

/**
 * Check if action is safe to auto-execute
 */
export function isSafeAction(actionType: string): boolean {
  const safeActions = [
    'update_config',
    'restart_service',
    'scale_resources'
  ];
  return safeActions.includes(actionType);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}
