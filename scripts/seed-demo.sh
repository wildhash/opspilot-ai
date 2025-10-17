#!/bin/bash
set -e

echo "🎬 OpsPilot Demo Setup Script"
echo "================================"

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found. Copy .env.example and configure."
  exit 1
fi

REGION=${AWS_REGION:-us-east-1}
FUNCTION_NAME=${TARGET_LAMBDA_FUNCTION:-orders-handler}
ROLE_ARN=${LAMBDA_EXECUTION_ROLE_ARN}

if [ -z "$ROLE_ARN" ]; then
  echo "❌ LAMBDA_EXECUTION_ROLE_ARN not set in .env"
  exit 1
fi

echo "📝 Configuration:"
echo "   Region: $REGION"
echo "   Function: $FUNCTION_NAME"
echo ""

# Step 1: Create demo Lambda function
echo "1️⃣  Creating demo Lambda function..."

# Create Lambda code that will reliably timeout
cat > /tmp/index.js << 'EOF'
exports.handler = async (event) => {
  console.log('Processing request...');
  
  // Simulate heavy processing that will timeout with 128MB/3s
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};
EOF

# Zip the function
cd /tmp
zip -q function.zip index.js
cd - > /dev/null

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
  echo "   ⚠️  Function exists, updating..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb:///tmp/function.zip \
    --region $REGION > /dev/null
else
  echo "   ✨ Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb:///tmp/function.zip \
    --timeout 3 \
    --memory-size 128 \
    --region $REGION > /dev/null
fi

# Wait for function to be active
echo "   ⏳ Waiting for function to be active..."
aws lambda wait function-active --function-name $FUNCTION_NAME --region $REGION

# Step 2: Configure the function to fail
echo "2️⃣  Configuring function with problematic settings..."
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --memory-size 128 \
  --timeout 3 \
  --region $REGION > /dev/null

aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION

# Step 3: Generate error traffic
echo "3️⃣  Generating error traffic (50 invocations)..."
for i in {1..50}; do
  aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"test": true}' \
    --region $REGION \
    /dev/null 2>&1 | grep -q "error" && echo -n "." || echo -n "."
  sleep 0.1
done
echo ""

# Step 4: Verify errors in CloudWatch
echo "4️⃣  Verifying errors in CloudWatch..."
sleep 5  # Wait for metrics to populate

ERRORS=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --query 'Datapoints[0].Sum' \
  --output text)

if [ "$ERRORS" != "None" ] && [ "$ERRORS" != "" ]; then
  echo "   ✅ Error count: $ERRORS"
else
  echo "   ⚠️  No errors detected yet (may take a few minutes)"
fi

# Step 5: Create DynamoDB table if needed
echo "5️⃣  Checking DynamoDB audit table..."
TABLE_NAME=${DYNAMODB_TABLE_NAME:-opspilot_audit}

if ! aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION &> /dev/null; then
  echo "   ✨ Creating audit table..."
  aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions \
      AttributeName=incidentId,AttributeType=S \
      AttributeName=timestamp,AttributeType=S \
    --key-schema \
      AttributeName=incidentId,KeyType=HASH \
      AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION > /dev/null
  
  echo "   ⏳ Waiting for table to be active..."
  aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION
else
  echo "   ✅ Table exists"
fi

# Step 6: Build and warm up the application
echo "6️⃣  Building application..."
npm run build > /dev/null 2>&1

echo ""
echo "✅ Demo environment ready!"
echo ""
echo "📋 Summary:"
echo "   Lambda: $FUNCTION_NAME"
echo "   Memory: 128MB (intentionally low)"
echo "   Timeout: 3s (intentionally short)"
echo "   Errors generated: ~50"
echo "   DynamoDB: $TABLE_NAME"
echo ""
echo "🚀 To start demo:"
echo "   Terminal 1: npm run dev:backend"
echo "   Terminal 2: npm run dev:frontend"
echo "   Browser: http://localhost:3000"
echo ""
echo "🎬 Demo incident text:"
echo "   'Lambda $FUNCTION_NAME in $REGION is experiencing high timeout rate and errors'"
