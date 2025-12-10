# AWS Lambda & API Gateway Deployment Brief

## Executive Summary

Deploy the Patient Management API as a serverless application using AWS Lambda (compute) and API Gateway (REST endpoint), eliminating server management while maintaining full functionality.

---

## High-Level Architecture

```
Client Requests 
    ↓
API Gateway (REST endpoint)
    ↓
Lambda Function (Express app wrapper)
    ↓
AWS Services (DynamoDB, OpenSearch, Cognito)
```

---

## Deployment Strategy (5 Steps)

### Step 1: Code Preparation
- Wrap Express app with AWS Lambda handler
- Install: `aws-serverless-express` package
- Create `lambda.ts` handler to bridge Express ↔ Lambda

### Step 2: IAM Role Setup
Create Lambda execution role with permissions:
- **DynamoDB**: Read/Write to Patients table
- **OpenSearch**: Full-text search operations
- **Cognito**: JWT token verification
- **CloudWatch**: Logging for debugging
- **Secrets Manager**: Access sensitive credentials

### Step 3: API Gateway Configuration
- Create REST API
- Map HTTP methods (GET, POST, PUT, DELETE) to Lambda
- Enable **Lambda proxy integration** (auto-routes all requests)
- Configure CORS for client requests
- Set Cognito authorizer for protected endpoints

### Step 4: Deploy to Lambda
- Build TypeScript → JavaScript
- Package with dependencies as ZIP
- Upload to Lambda console or via CLI
- Set environment variables (AWS_REGION, table names, etc.)
- Configure timeout (30 seconds) & memory (512 MB)

### Step 5: API Gateway Deployment
- Deploy to stage (dev/prod)
- Get public API endpoint: `https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod`
- Test all endpoints
- Monitor via CloudWatch

---

## Critical Serverless Considerations

| Consideration | Impact | Solution |
|---|---|---|
| **Cold Starts** | 1-5 sec delay on first invocation | Provisioned concurrency, optimize bundle size |
| **Memory Limits** | Default 128 MB insufficient | Allocate 512 MB - 1 GB for this API |
| **Timeout Limits** | Default 3 sec too short | Set 30 seconds for patient operations |
| **Concurrent Requests** | Default 1000 might not handle spikes | Set reserved concurrency if needed |
| **No Local Storage** | `/tmp` only, 512 MB, not persistent | Cache data in memory or use DynamoDB |
| **Credential Management** | Never hardcode AWS keys | Use IAM roles + Secrets Manager |

---

## IAM Role Permissions (Simplified)

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query"
  ],
  "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Patients"
}
```

**Trust Policy**: Allow Lambda service to assume this role

---

## Deployment Flow (CLI Commands)

```bash
# 1. Build
npm run build:lambda
# Creates: lambda-function.zip with dist/ + node_modules/

# 2. Deploy Lambda
aws lambda create-function \
  --function-name patient-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/LambdaRole \
  --handler dist/lambda.handler \
  --zip-file fileb://lambda-function.zip \
  --timeout 30 \
  --memory-size 512

# 3. Create API Gateway
# (via console: create REST API, add resources, methods, Lambda integration)

# 4. Deploy API
aws apigateway create-deployment \
  --rest-api-id xxxxx \
  --stage-name prod
```

---

## Key Configuration Values

```env
AWS_REGION=ap-south-1
COGNITO_USER_POOL_ID=ap-south-1_xxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxx
PATIENTS_TABLE_NAME=Patients
OPENSEARCH_DOMAIN=domain-name
```

Set these as **Lambda environment variables** → Configuration tab

---

## Testing After Deployment

```bash
# Test public endpoint
curl https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod/health

# Test with authentication
curl -H "Authorization: Bearer TOKEN" \
  https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod/api/patients \
  -X POST \
  -d '{"name":"John","address":"123 St","conditions":[],"allergies":[]}'
```

---

## Monitoring & Troubleshooting

**CloudWatch Logs**: Track Lambda execution
```bash
aws logs tail /aws/lambda/patient-api --follow
```

**Common Issues**:
- **Function timeout**: Increase timeout value
- **Permission denied**: Check IAM role permissions
- **Cold start slow**: Reduce package size or use provisioned concurrency
- **DynamoDB errors**: Verify table exists and region matches
