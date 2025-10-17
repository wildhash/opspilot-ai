/**
 * DynamoDB integration for audit trail and state management
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { AuditEntry, Incident, RemediationPlan, ActionPlan } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(region: string = 'us-east-1', tableName: string = 'OpsPilotAuditTrail') {
    const dynamoClient = new DynamoDBClient({ region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
  }

  /**
   * Initialize audit trail table
   */
  async initializeTable(): Promise<void> {
    const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
    
    try {
      await dynamoClient.send(new DescribeTableCommand({ TableName: this.tableName }));
    } catch (error) {
      // Table doesn't exist, create it
      await dynamoClient.send(new CreateTableCommand({
        TableName: this.tableName,
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'incidentId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'IncidentIdIndex',
            KeySchema: [
              { AttributeName: 'incidentId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }));
    }
  }

  /**
   * Log an audit entry
   */
  async logAudit(entry: Omit<AuditEntry, 'id'>): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      id: uuidv4(),
      ...entry
    };

    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        ...auditEntry,
        timestamp: auditEntry.timestamp.toISOString()
      }
    }));

    return auditEntry;
  }

  /**
   * Get audit trail for an incident
   */
  async getAuditTrail(incidentId: string): Promise<AuditEntry[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'IncidentIdIndex',
      KeyConditionExpression: 'incidentId = :incidentId',
      ExpressionAttributeValues: {
        ':incidentId': incidentId
      },
      ScanIndexForward: true
    });

    const response = await this.client.send(command);
    return (response.Items || []).map(item => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })) as AuditEntry[];
  }

  /**
   * Save incident
   */
  async saveIncident(incident: Incident): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: `${this.tableName}-Incidents`,
      Item: {
        ...incident,
        timestamp: incident.timestamp.toISOString()
      }
    }));

    // Log audit entry
    await this.logAudit({
      incidentId: incident.id,
      timestamp: new Date(),
      action: 'incident_created',
      actor: 'system',
      details: { severity: incident.severity, resourceArn: incident.resourceArn },
      result: 'success'
    });
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: Incident['status'],
    details?: Record<string, any>
  ): Promise<void> {
    await this.client.send(new UpdateCommand({
      TableName: `${this.tableName}-Incidents`,
      Key: { id: incidentId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }));

    // Log audit entry
    await this.logAudit({
      incidentId,
      timestamp: new Date(),
      action: 'status_updated',
      actor: 'system',
      details: { newStatus: status, ...details },
      result: 'success'
    });
  }

  /**
   * Save remediation plan
   */
  async saveRemediationPlan(plan: RemediationPlan): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: `${this.tableName}-Plans`,
      Item: {
        ...plan,
        createdAt: plan.createdAt.toISOString()
      }
    }));

    // Log audit entry
    await this.logAudit({
      incidentId: plan.incidentId,
      timestamp: new Date(),
      action: 'plan_created',
      actor: 'system',
      details: { 
        planId: plan.id, 
        actionCount: plan.actions.length,
        approvalRequired: plan.approvalRequired
      },
      result: 'success'
    });
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<Incident | null> {
    const response = await this.client.send(new GetCommand({
      TableName: `${this.tableName}-Incidents`,
      Key: { id: incidentId }
    }));

    if (!response.Item) {
      return null;
    }

    return {
      ...response.Item,
      timestamp: new Date(response.Item.timestamp)
    } as Incident;
  }

  /**
   * Get all open incidents
   */
  async getOpenIncidents(): Promise<Incident[]> {
    const response = await this.client.send(new ScanCommand({
      TableName: `${this.tableName}-Incidents`,
      FilterExpression: '#status IN (:open, :investigating, :remediating)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':open': 'open',
        ':investigating': 'investigating',
        ':remediating': 'remediating'
      }
    }));

    return (response.Items || []).map(item => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })) as Incident[];
  }

  /**
   * Log action execution
   */
  async logActionExecution(
    incidentId: string,
    actionId: string,
    result: 'success' | 'failure',
    details: Record<string, any>
  ): Promise<void> {
    await this.logAudit({
      incidentId,
      timestamp: new Date(),
      action: `action_executed_${actionId}`,
      actor: 'system',
      details,
      result
    });
  }

  /**
   * Get cached plan for demo reliability
   */
  async getCachedPlan(): Promise<ActionPlan | null> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          id: 'demo_plan_latest',
          timestamp: 'cache'
        }
      }));
      
      if (response.Item?.payload) {
        const cached = JSON.parse(response.Item.payload as string);
        return cached.plan;
      }
    } catch (e) {
      console.warn('No cached plan found');
    }
    return null;
  }

  /**
   * Cache plan for demo reliability
   */
  async cachePlan(plan: ActionPlan): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        id: 'demo_plan_latest',
        timestamp: 'cache',
        payload: JSON.stringify({ plan, cachedAt: new Date().toISOString() })
      }
    }));
  }
}
