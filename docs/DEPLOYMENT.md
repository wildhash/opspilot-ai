# Deployment Guide

## Prerequisites

### AWS Account Setup
1. **Enable Bedrock Access**
   ```bash
   # Request access to Claude 3 models in AWS Console
   # Navigate to: Bedrock → Model access → Request access
   ```

2. **Install AWS CLI**
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

3. **Configure AWS Credentials**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your default region (e.g., us-east-1)
   # Enter output format (json)
   ```

### Local Setup
```bash
# Install Node.js 18+ (using nvm)
nvm install 18
nvm use 18

# Clone repository
git clone https://github.com/wildhash/opspilot-ai.git
cd opspilot-ai

# Install dependencies
npm install
```

## Deployment Options

### Option 1: AWS CDK (Recommended)

#### Step 1: Install CDK
```bash
npm install -g aws-cdk
```

#### Step 2: Bootstrap CDK (first time only)
```bash
cd cdk
cdk bootstrap
```

#### Step 3: Review Infrastructure
```bash
cdk synth
```

#### Step 4: Deploy
```bash
# Deploy all resources
cdk deploy

# Deploy with auto-approval
cdk deploy --require-approval never
```

#### Step 5: Get Outputs
```bash
# Stack outputs will show:
# - Lambda function name
# - DynamoDB table names
# - API Gateway endpoint (if configured)
```

### Option 2: Manual Deployment

#### Step 1: Build Project
```bash
npm run build
```

#### Step 2: Create DynamoDB Tables
```bash
aws dynamodb create-table \
  --table-name OpsPilotAuditTrail \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
    AttributeName=incidentId,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"IncidentIdIndex\",\"KeySchema\":[{\"AttributeName\":\"incidentId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"timestamp\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
```

#### Step 3: Create IAM Role
```bash
# Create role
aws iam create-role \
  --role-name OpsPilotLambdaRole \
  --assume-role-policy-document file://iam-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name OpsPilotLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach custom policy
aws iam put-role-policy \
  --role-name OpsPilotLambdaRole \
  --policy-name OpsPilotPolicy \
  --policy-document file://custom-policy.json
```

#### Step 4: Package Lambda
```bash
# Create deployment package
cd dist
zip -r ../opspilot.zip .
cd ..
```

#### Step 5: Deploy Lambda
```bash
aws lambda create-function \
  --function-name OpsPilot \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/OpsPilotLambdaRole \
  --handler lambda/handler.handler \
  --zip-file fileb://opspilot.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{AUDIT_TABLE_NAME=OpsPilotAuditTrail,AWS_REGION=us-east-1}"
```

### Option 3: Serverless Framework

#### Step 1: Install Serverless
```bash
npm install -g serverless
```

#### Step 2: Create serverless.yml
```yaml
service: opspilot-ai

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  memorySize: 512
  timeout: 300

functions:
  opspilot:
    handler: dist/lambda/handler.handler
    events:
      - http:
          path: incident
          method: post

resources:
  Resources:
    # DynamoDB tables
    # IAM roles
    # CloudWatch alarms
```

#### Step 3: Deploy
```bash
serverless deploy
```

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

### Option 2: AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
cd frontend
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 3: S3 + CloudFront

```bash
# Build frontend
cd frontend
npm run build

# Deploy to S3
aws s3 sync out/ s3://your-bucket-name/

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name your-bucket-name.s3.amazonaws.com \
  --default-root-object index.html
```

## Configuration

### Environment Variables

#### Backend (Lambda)
```bash
AUDIT_TABLE_NAME=OpsPilotAuditTrail
INCIDENTS_TABLE_NAME=OpsPilotIncidents
PLANS_TABLE_NAME=OpsPilotPlans
AWS_REGION=us-east-1
LOG_LEVEL=info
```

#### Frontend
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### AWS Service Configuration

#### Bedrock Model Access
1. Go to AWS Console → Bedrock
2. Click "Model access"
3. Enable Claude 3 models:
   - Claude 3 Sonnet (recommended)
   - Claude 3 Haiku (fast)
   - Claude 3 Opus (advanced)

#### CloudWatch Log Retention
```bash
aws logs put-retention-policy \
  --log-group-name /aws/lambda/OpsPilot \
  --retention-in-days 7
```

## Verification

### Test Lambda Function
```bash
aws lambda invoke \
  --function-name OpsPilot \
  --payload '{"severity":"high","resourceArn":"arn:aws:lambda:us-east-1:123:function:test","resourceType":"lambda","description":"Test incident"}' \
  response.json

cat response.json
```

### Check DynamoDB Tables
```bash
aws dynamodb list-tables

aws dynamodb scan \
  --table-name OpsPilotAuditTrail \
  --max-items 10
```

### View Logs
```bash
aws logs tail /aws/lambda/OpsPilot --follow
```

## Monitoring Setup

### CloudWatch Alarms
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name OpsPilot-HighErrors \
  --alarm-description "OpsPilot error rate exceeded" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=OpsPilot
```

### Dashboard
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name OpsPilot \
  --dashboard-body file://dashboard.json
```

## Rollback

### Rollback CDK Deployment
```bash
cdk destroy
```

### Rollback Lambda
```bash
# List versions
aws lambda list-versions-by-function --function-name OpsPilot

# Update to previous version
aws lambda update-function-configuration \
  --function-name OpsPilot \
  --publish-version $PREVIOUS_VERSION
```

### Rollback Database
```bash
# DynamoDB point-in-time recovery
aws dynamodb restore-table-to-point-in-time \
  --source-table-name OpsPilotAuditTrail \
  --target-table-name OpsPilotAuditTrail-Restored \
  --restore-date-time 2024-01-01T00:00:00Z
```

## Troubleshooting

### Common Issues

#### 1. Bedrock Access Denied
```
Error: AccessDeniedException
Solution: Request model access in Bedrock console
```

#### 2. Lambda Timeout
```
Error: Task timed out after 300.00 seconds
Solution: Increase timeout in CDK or Lambda console
```

#### 3. DynamoDB Throttling
```
Error: ProvisionedThroughputExceededException
Solution: Switch to on-demand billing or increase capacity
```

#### 4. IAM Permissions
```
Error: User is not authorized
Solution: Add required permissions to IAM role
```

## Cost Estimation

### Monthly Costs (Typical Usage)
- **Lambda**: $5-20 (1000 invocations/month)
- **Bedrock**: $10-50 (depends on usage)
- **DynamoDB**: $5-15 (pay-per-request)
- **CloudWatch**: $5-10 (logs & metrics)
- **Total**: ~$25-95/month

### Cost Optimization
1. Use Lambda reserved concurrency
2. Implement log filtering
3. Set DynamoDB TTL on old audit records
4. Use Bedrock batch processing
5. Enable CloudWatch Logs retention

## Security Hardening

### Best Practices
1. Enable VPC for Lambda
2. Use Secrets Manager for sensitive data
3. Enable CloudTrail for API auditing
4. Implement least-privilege IAM policies
5. Enable encryption at rest
6. Use AWS KMS for key management
7. Enable MFA for console access

### Compliance
- SOC 2: Enable CloudTrail and audit logs
- HIPAA: Use encryption, VPC, and access controls
- PCI DSS: Implement security groups and NACLs
