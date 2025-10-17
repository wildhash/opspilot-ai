# 🎬 OpsPilot Demo Checklist

## Pre-Demo Setup (Night Before)

### Environment Setup
- [ ] `.env` file configured with AWS credentials
- [ ] DynamoDB table created
- [ ] Demo Lambda function seeded
- [ ] Error traffic generated (50+ invocations)
- [ ] CloudWatch showing errors

### Application Build
- [ ] `npm install` completed (backend + frontend)
- [ ] `npm run build` successful
- [ ] Both dev servers tested locally

### Backup Materials
- [ ] Screen recording of successful run saved
- [ ] Screenshots of each phase captured
- [ ] DynamoDB audit entry exported
- [ ] Printed demo script in hand

## Demo Day Morning

### Pre-Warm Services
- [ ] Terminal 1: `npm run dev:backend` running
- [ ] Terminal 2: `npm run dev:frontend` running
- [ ] Browser tabs open:
  - [ ] http://localhost:3000 (OpsPilot dashboard)
  - [ ] AWS CloudWatch Console (Lambda metrics)
  - [ ] AWS DynamoDB Console (audit table)

### Final Checks
- [ ] Health check endpoint responding: `curl localhost:3001/health`
- [ ] Demo Lambda still misconfigured (128MB/3s)
- [ ] Recent errors visible in CloudWatch
- [ ] Incident text ready to paste

## During Demo (3 Minutes)

### 0:00-0:25 | Hook
- [ ] Show CloudWatch errors
- [ ] Explain the problem clearly
- [ ] Switch to OpsPilot dashboard

### 0:25-0:50 | Investigation
- [ ] Paste incident text
- [ ] Click "Start Investigation"
- [ ] Narrate what's happening

### 0:50-1:30 | Diagnosis
- [ ] Show root cause analysis
- [ ] Display remediation plan
- [ ] Highlight safety guardrails

### 1:30-2:10 | Execution
- [ ] Click "Execute Remediation"
- [ ] Show live progress
- [ ] Display before/after metrics

### 2:10-2:45 | Explain Agentic Workflow
- [ ] Switch to DynamoDB audit trail
- [ ] Explain tool chaining
- [ ] Emphasize safety + observability

### 2:45-3:00 | Close
- [ ] Recap key features
- [ ] Thank judges

## Contingency Plans

### If Backend Fails
- [ ] Show pre-recorded video
- [ ] Explain: "Here's what it looks like when running..."

### If Bedrock API Errors
- [ ] Switch to DRY_RUN mode
- [ ] Show expected flow with mock data

### If Dashboard Crashes
- [ ] Fall back to CLI demo
- [ ] Show terminal output

### If Internet Dies
- [ ] Use offline slides
- [ ] Show architecture diagram + screenshots

## Post-Demo
- [ ] Answer questions confidently
- [ ] Offer to show code/architecture
- [ ] Collect judge feedback
