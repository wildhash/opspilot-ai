/**
 * Example: Agentic workflow with tool chaining
 */

import { BedrockService } from '../src/aws/bedrock';
import { ToolConfiguration } from '../src/types';

async function main() {
  const bedrock = new BedrockService('us-east-1');

  // Define tools for the agent
  const tools: ToolConfiguration = {
    tools: [
      {
        toolSpec: {
          name: 'analyze_metrics',
          description: 'Analyze CloudWatch metrics for a Lambda function',
          inputSchema: {
            json: {
              type: 'object',
              properties: {
                functionName: { type: 'string', description: 'Lambda function name' },
                metricName: { type: 'string', description: 'Metric to analyze (Errors, Duration, etc.)' }
              },
              required: ['functionName', 'metricName']
            }
          }
        }
      },
      {
        toolSpec: {
          name: 'query_logs',
          description: 'Query CloudWatch Logs for error messages',
          inputSchema: {
            json: {
              type: 'object',
              properties: {
                logGroup: { type: 'string', description: 'Log group name' },
                pattern: { type: 'string', description: 'Filter pattern' }
              },
              required: ['logGroup']
            }
          }
        }
      },
      {
        toolSpec: {
          name: 'update_configuration',
          description: 'Update Lambda function configuration',
          inputSchema: {
            json: {
              type: 'object',
              properties: {
                functionName: { type: 'string' },
                memorySize: { type: 'number' },
                timeout: { type: 'number' }
              },
              required: ['functionName']
            }
          }
        }
      }
    ],
    toolChoice: 'auto'
  };

  // Run agentic workflow
  const prompt = `
    I'm investigating a Lambda function called 'api-handler' that is experiencing issues.
    Please:
    1. Analyze the error metrics
    2. Check the logs for error patterns
    3. Determine the root cause
    4. Recommend configuration changes if needed
    
    Function: api-handler
    Issue: High error rate and timeout issues
  `;

  console.log('Starting agentic workflow...\n');

  const result = await bedrock.executeAgenticWorkflow(prompt, tools, 5);

  console.log('=== WORKFLOW RESULTS ===');
  console.log('Iterations:', result.iterations);
  console.log('Tool Calls:', result.toolCalls.length);
  
  console.log('\n=== TOOL CALLS ===');
  result.toolCalls.forEach((call, idx) => {
    console.log(`${idx + 1}. ${call.tool}`);
    console.log('   Input:', JSON.stringify(call.input, null, 2));
    console.log('   Output:', JSON.stringify(call.output, null, 2));
  });

  console.log('\n=== FINAL RESPONSE ===');
  console.log(result.finalResponse);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
