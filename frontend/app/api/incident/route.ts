import { NextRequest } from 'next/server';

// Type definitions
interface ActionPlan {
  intent: string;
  changes: {
    lambda?: {
      memoryMb?: number;
      timeoutSec?: number;
    };
    alarms?: Array<{
      metric: string;
      threshold: number;
      periodSec: number;
    }>;
  };
  verify: {
    invokeTest: boolean;
    successCriteria: string;
  };
  rollbackCriteria: string;
  notes: string;
}

interface MetricSeries {
  metric: string;
  values: number[];
  timestamps: Date[];
}

async function runIncident(_incidentText: string, _functionName: string, _region: string): Promise<{
  plan: ActionPlan;
  before: MetricSeries[];
  after: MetricSeries[];
}> {
  // This is a placeholder - in production, this would call the actual backend
  // For now, return mock data
  return {
    plan: {
      intent: 'reduce_timeouts',
      changes: {
        lambda: {
          memoryMb: 512,
          timeoutSec: 30
        },
        alarms: [
          {
            metric: 'Errors',
            threshold: 10,
            periodSec: 300
          }
        ]
      },
      verify: {
        invokeTest: true,
        successCriteria: 'Error rate < 1% and duration < 1000ms'
      },
      rollbackCriteria: 'If error rate increases by 10% or duration increases by 50%',
      notes: 'Increasing memory and timeout to handle workload spikes'
    },
    before: [
      {
        metric: 'Errors',
        values: [5, 8, 12, 15, 10, 20, 18, 16, 14, 22],
        timestamps: []
      },
      {
        metric: 'Duration',
        values: [1200, 1500, 1800, 2000, 1700, 2200, 1900, 1600, 1400, 2100],
        timestamps: []
      }
    ],
    after: [
      {
        metric: 'Errors',
        values: [2, 1, 3, 2, 1, 0, 1, 2, 1, 1],
        timestamps: []
      },
      {
        metric: 'Duration',
        values: [800, 750, 900, 850, 700, 650, 750, 800, 700, 600],
        timestamps: []
      }
    ]
  };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { incidentText, functionName, region } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send('status', { message: 'Investigating function configuration...' });
        
        // Run the incident response
        const result = await runIncident(incidentText, functionName, region);
        
        send('plan', { plan: result.plan });
        send('metrics', { before: result.before, after: result.after });
        send('complete', { status: 'success', result });
        
        controller.close();
      } catch (error) {
        const err = error as Error;
        send('error', { message: err.message, stack: err.stack });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
