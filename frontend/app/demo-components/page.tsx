'use client';

import { IncidentProgress } from '@/components/IncidentProgress';
import { MetricsComparison } from '@/components/MetricsComparison';

export default function DemoComponentsPage() {
  // Sample data for IncidentProgress
  const sampleSteps = [
    {
      id: 'step1',
      label: 'Gathering CloudWatch Metrics',
      status: 'complete' as const,
      detail: 'Retrieved Lambda metrics, errors, and duration data',
    },
    {
      id: 'step2',
      label: 'Querying CloudWatch Logs',
      status: 'complete' as const,
      detail: 'Found 47 error messages in last hour',
    },
    {
      id: 'step3',
      label: 'Analyzing with Bedrock AI',
      status: 'active' as const,
      detail: 'Using Claude 3 to diagnose root cause...',
    },
    {
      id: 'step4',
      label: 'Generating Remediation Plan',
      status: 'pending' as const,
    },
    {
      id: 'step5',
      label: 'Executing Remediation',
      status: 'pending' as const,
    },
    {
      id: 'step6',
      label: 'Verifying Success',
      status: 'pending' as const,
    },
  ];

  // Sample data for MetricsComparison
  const sampleMetrics = [
    {
      name: 'Error Rate',
      before: 45.2,
      after: 2.1,
      unit: '%',
    },
    {
      name: 'Average Duration',
      before: 4500,
      after: 850,
      unit: 'ms',
      formatValue: (v: number) => v.toFixed(0),
    },
    {
      name: 'Timeout Rate',
      before: 38.5,
      after: 0.5,
      unit: '%',
    },
    {
      name: 'Memory Utilization',
      before: 98.3,
      after: 45.2,
      unit: '%',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            OpsPilot AI - New Components Demo
          </h1>
          <p className="text-slate-400 text-lg">
            Visual showcase of the new UI components for hackathon demo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* IncidentProgress Component */}
          <div className="space-y-4">
            <div className="text-white">
              <h2 className="text-2xl font-semibold mb-2">Incident Progress Component</h2>
              <p className="text-slate-400 text-sm">
                Shows real-time progress with animated loading states
              </p>
            </div>
            <IncidentProgress steps={sampleSteps} />
          </div>

          {/* MetricsComparison Component */}
          <div className="space-y-4">
            <div className="text-white">
              <h2 className="text-2xl font-semibold mb-2">Metrics Comparison Component</h2>
              <p className="text-slate-400 text-sm">
                Visualizes before/after metrics with improvement indicators
              </p>
            </div>
            <MetricsComparison metrics={sampleMetrics} />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-800 rounded-lg p-6 mt-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Enhancement Package Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="font-semibold text-emerald-400 mb-2">✅ Demo Infrastructure</h3>
              <ul className="space-y-1 text-sm">
                <li>• Environment templates (.env.example)</li>
                <li>• Automated demo seed script</li>
                <li>• Dry-run mode for offline demos</li>
                <li>• Config management module</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">✅ Frontend Polish</h3>
              <ul className="space-y-1 text-sm">
                <li>• Animated progress indicators</li>
                <li>• Before/after metrics visualization</li>
                <li>• Demo mode banner</li>
                <li>• Trend indicators with icons</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">✅ Reliability</h3>
              <ul className="space-y-1 text-sm">
                <li>• Health check endpoints</li>
                <li>• Error boundary components</li>
                <li>• Graceful degradation</li>
                <li>• AWS service validation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">✅ Documentation</h3>
              <ul className="space-y-1 text-sm">
                <li>• Quick demo guide (5 minutes)</li>
                <li>• Detailed demo checklist</li>
                <li>• Troubleshooting tips</li>
                <li>• Contingency plans</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">1. Setup Environment</h3>
              <pre className="bg-slate-900 rounded p-4 text-sm text-slate-300 overflow-x-auto">
                cp .env.example .env
                # Edit .env with your AWS credentials
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">2. Run Demo Seed Script</h3>
              <pre className="bg-slate-900 rounded p-4 text-sm text-slate-300 overflow-x-auto">
                chmod +x scripts/seed-demo.sh
                ./scripts/seed-demo.sh
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">3. Start Application</h3>
              <pre className="bg-slate-900 rounded p-4 text-sm text-slate-300 overflow-x-auto">
                npm run dev:backend    # Terminal 1
                npm run dev:frontend   # Terminal 2
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
