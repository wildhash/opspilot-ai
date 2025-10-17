#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OpsPilotStack } from './opspilot-stack';

const app = new cdk.App();
new OpsPilotStack(app, 'OpsPilotStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'OpsPilot AI - Agentic incident response system for AWS'
});
