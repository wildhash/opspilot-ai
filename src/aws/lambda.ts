/**
 * AWS Lambda integration for managing and testing Lambda functions
 */

import {
  LambdaClient,
  GetFunctionCommand,
  UpdateFunctionConfigurationCommand,
  InvokeCommand,
  GetFunctionConfigurationCommand,
  UpdateFunctionCodeCommand
} from '@aws-sdk/client-lambda';

export class LambdaService {
  private client: LambdaClient;

  constructor(region: string = 'us-east-1') {
    this.client = new LambdaClient({ region });
  }

  /**
   * Get function configuration
   */
  async getFunctionConfig(functionName: string): Promise<any> {
    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName
    });
    return await this.client.send(command);
  }

  /**
   * Alias for getFunctionConfig
   */
  async getFunctionConfiguration(functionName: string): Promise<any> {
    return this.getFunctionConfig(functionName);
  }

  /**
   * Alias for updateFunctionConfig
   */
  async updateFunctionConfiguration(functionName: string, updates: any): Promise<any> {
    return this.updateFunctionConfig(functionName, updates);
  }

  /**
   * Update function configuration
   */
  async updateFunctionConfig(
    functionName: string,
    updates: {
      timeout?: number;
      memorySize?: number;
      environment?: Record<string, string>;
    }
  ): Promise<any> {
    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Timeout: updates.timeout,
      MemorySize: updates.memorySize,
      Environment: updates.environment ? {
        Variables: updates.environment
      } : undefined
    });
    return await this.client.send(command);
  }

  /**
   * Invoke Lambda function for testing
   */
  async invokeFunction(
    functionName: string,
    payload: any,
    invocationType: 'RequestResponse' | 'Event' | 'DryRun' = 'RequestResponse'
  ): Promise<{
    statusCode: number;
    payload: any;
    executedVersion?: string;
    functionError?: string;
  }> {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: invocationType,
      Payload: JSON.stringify(payload)
    });

    const response = await this.client.send(command);
    
    return {
      statusCode: response.StatusCode || 0,
      payload: response.Payload ? JSON.parse(Buffer.from(response.Payload).toString()) : null,
      executedVersion: response.ExecutedVersion,
      functionError: response.FunctionError
    };
  }

  /**
   * Test function with multiple invocations
   */
  async testFunction(
    functionName: string,
    testPayloads: any[],
    concurrency: number = 1
  ): Promise<{
    totalTests: number;
    successful: number;
    failed: number;
    results: Array<{ success: boolean; duration?: number; error?: string }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < testPayloads.length; i += concurrency) {
      const batch = testPayloads.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async payload => {
          const startTime = Date.now();
          try {
            const result = await this.invokeFunction(functionName, payload);
            const duration = Date.now() - startTime;
            
            if (result.statusCode === 200 && !result.functionError) {
              successful++;
              return { success: true, duration };
            } else {
              failed++;
              return { success: false, duration, error: result.functionError };
            }
          } catch (error) {
            failed++;
            return { 
              success: false, 
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );
      results.push(...batchResults);
    }

    return {
      totalTests: testPayloads.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Get function details
   */
  async getFunctionDetails(functionName: string): Promise<any> {
    const command = new GetFunctionCommand({
      FunctionName: functionName
    });
    return await this.client.send(command);
  }

  /**
   * Check if function is healthy
   */
  async checkFunctionHealth(functionName: string): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      const config = await this.getFunctionConfig(functionName);
      
      // Check for common issues
      if (config.Timeout && config.Timeout < 3) {
        issues.push('Timeout is very low (< 3 seconds)');
      }
      
      if (config.MemorySize && config.MemorySize < 256) {
        issues.push('Memory size is very low (< 256 MB)');
      }

      // Try a test invocation
      try {
        await this.invokeFunction(functionName, {}, 'DryRun');
      } catch (error) {
        issues.push(`Test invocation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return {
        healthy: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Failed to check function health: ${error instanceof Error ? error.message : String(error)}`);
      return {
        healthy: false,
        issues
      };
    }
  }
}
