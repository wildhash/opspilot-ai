'use client';

import { useState } from 'react';
import { PlanPreview } from './PlanPreview';
import { MetricsChart } from './MetricsChart';

interface ActionPlan {
  intent: 'reduce_timeouts' | 'reduce_5xx' | 'reduce_latency' | 'stabilize_concurrency';
  changes: {
    lambda?: {
      memoryMb?: number;
      timeoutSec?: number;
      reservedConcurrency?: number | null;
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

export default function IncidentResponseDemo() {
  const [incidentText, setIncidentText] = useState('Lambda function experiencing high timeout rate and increased error rate');
  const [functionName, setFunctionName] = useState('orders-handler');
  const [region, setRegion] = useState('us-east-1');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [metrics, setMetrics] = useState<{ before: MetricSeries[]; after: MetricSeries[] } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Investigating incident...');
    setPlan(null);
    setMetrics(null);
    setShowResults(false);

    try {
      const response = await fetch('/api/incident', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentText,
          functionName,
          region,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let isDone = false;
      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) {
          isDone = true;
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.substring(7);
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine && dataLine.startsWith('data: ')) {
              const data = JSON.parse(dataLine.substring(6));

              if (event === 'status') {
                setStatus(data.message);
              } else if (event === 'plan') {
                setPlan(data.plan);
                setStatus('Plan generated! Review the proposed changes below.');
              } else if (event === 'metrics') {
                setMetrics({ before: data.before, after: data.after });
              } else if (event === 'complete') {
                // Don't auto-show results - wait for user to proceed
                if (!plan) {
                  setStatus('Incident response complete!');
                }
              } else if (event === 'error') {
                setStatus(`Error: ${data.message}`);
              }
            }
          }
        }
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    setStatus('Executing remediation plan...');
    // NOTE: Demo simulation - in production, this would trigger actual AWS API calls
    // to apply the remediation plan and wait for real metric improvements
    setTimeout(() => {
      setStatus('Remediation complete! Monitoring for improvements...');
      setShowResults(true);
    }, 2000);
  };

  const handleCancel = () => {
    setPlan(null);
    setStatus('Plan cancelled. No changes were made.');
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-2">
          🤖 AI-Powered Incident Response
        </h2>
        <p className="text-slate-300">
          Describe an incident and let OpsPilot AI investigate, diagnose, and propose a remediation plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident Description
            </label>
            <textarea
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Describe the incident..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Function Name
              </label>
              <input
                type="text"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="my-lambda-function"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="us-east-1">us-east-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-west-1">eu-west-1</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Investigating...' : 'Investigate & Remediate'}
          </button>
        </div>
      </form>

      {status && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            <p className="text-blue-800 font-medium">{status}</p>
          </div>
        </div>
      )}

      {plan && !showResults && (
        <PlanPreview plan={plan} onProceed={handleProceed} onCancel={handleCancel} />
      )}

      {showResults && metrics && (
        <div className="card bg-slate-900">
          <h3 className="text-xl font-bold text-white mb-4">Remediation Results</h3>
          <MetricsChart before={metrics.before} after={metrics.after} />
        </div>
      )}
    </div>
  );
}
