/**
 * AWS Lambda handler for OpsPilot incident response
 */

import { OpsPilotAgent } from '../agent/opspilot';
import { Incident } from '../types';
import { DynamoDBService } from '../aws/dynamodb';

const agent = new OpsPilotAgent(process.env.AWS_REGION || 'us-east-1');
const dynamodb = new DynamoDBService(process.env.AWS_REGION || 'us-east-1');

export interface IncidentEvent {
  incidentId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resourceArn: string;
  resourceType: 'lambda' | 'ecs' | 'ec2' | 'rds';
  description: string;
  metrics?: Record<string, number>;
  logs?: string[];
}

/**
 * Main Lambda handler
 */
export async function handler(event: IncidentEvent) {
  console.log('OpsPilot Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    // Check if this is a status query
    if (event.incidentId && !event.resourceArn) {
      const incident = await dynamodb.getIncident(event.incidentId);
      const auditTrail = await dynamodb.getAuditTrail(event.incidentId);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          incident,
          auditTrail,
          message: 'Incident status retrieved'
        })
      };
    }

    // Create incident object
    const incident: Incident = {
      id: event.incidentId || `incident-${Date.now()}`,
      timestamp: new Date(),
      severity: event.severity,
      resourceArn: event.resourceArn,
      resourceType: event.resourceType,
      description: event.description,
      metrics: event.metrics,
      logs: event.logs,
      status: 'open'
    };

    // Handle the incident
    const result = await agent.handleIncident(incident);

    return {
      statusCode: 200,
      body: JSON.stringify({
        incidentId: incident.id,
        status: result.verification.success ? 'resolved' : 'failed',
        diagnosis: result.diagnosis.rootCause,
        actionsExecuted: result.executionResults.length,
        verification: result.verification,
        message: 'Incident processed successfully'
      })
    };
  } catch (error) {
    console.error('Error processing incident:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to process incident'
      })
    };
  }
}

/**
 * Initialize handler (for testing)
 */
export async function initialize() {
  await dynamodb.initializeTable();
  console.log('OpsPilot Lambda initialized');
}
