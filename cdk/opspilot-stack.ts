import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class OpsPilotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB tables
    const auditTable = new dynamodb.Table(this, 'AuditTrail', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });

    auditTable.addGlobalSecondaryIndex({
      indexName: 'IncidentIdIndex',
      partitionKey: { name: 'incidentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING }
    });

    const incidentsTable = new dynamodb.Table(this, 'Incidents', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    const plansTable = new dynamodb.Table(this, 'RemediationPlans', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'OpsPilotLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: ['*']
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cloudwatch:GetMetricData',
        'cloudwatch:GetMetricStatistics',
        'logs:FilterLogEvents',
        'logs:GetLogEvents'
      ],
      resources: ['*']
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'lambda:GetFunction',
        'lambda:GetFunctionConfiguration',
        'lambda:UpdateFunctionConfiguration',
        'lambda:InvokeFunction'
      ],
      resources: ['*']
    }));

    auditTable.grantReadWriteData(lambdaRole);
    incidentsTable.grantReadWriteData(lambdaRole);
    plansTable.grantReadWriteData(lambdaRole);

    // OpsPilot Lambda function
    const opsPilotFunction = new lambda.Function(this, 'OpsPilotFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/lambda/handler.handler',
      code: lambda.Code.fromAsset('../'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaRole,
      environment: {
        AUDIT_TABLE_NAME: auditTable.tableName,
        INCIDENTS_TABLE_NAME: incidentsTable.tableName,
        PLANS_TABLE_NAME: plansTable.tableName,
        AWS_REGION: this.region
      },
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Outputs
    new cdk.CfnOutput(this, 'FunctionName', {
      value: opsPilotFunction.functionName,
      description: 'OpsPilot Lambda function name'
    });

    new cdk.CfnOutput(this, 'AuditTableName', {
      value: auditTable.tableName,
      description: 'Audit trail DynamoDB table'
    });

    new cdk.CfnOutput(this, 'IncidentsTableName', {
      value: incidentsTable.tableName,
      description: 'Incidents DynamoDB table'
    });
  }
}
