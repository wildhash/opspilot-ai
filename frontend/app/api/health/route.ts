import { NextResponse } from 'next/server';

// Simple health check that doesn't require AWS credentials
// For a full health check with AWS services, use the backend health endpoint
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'opspilot-frontend',
    version: '1.0.0',
  };

  return NextResponse.json(health);
}
