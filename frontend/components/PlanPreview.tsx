'use client';

import { CheckCircle } from 'lucide-react';

// Type definitions
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

interface PlanPreviewProps {
  plan: ActionPlan;
  onProceed: () => void;
  onCancel: () => void;
}

export function PlanPreview({ plan, onProceed, onCancel }: PlanPreviewProps) {
  const memoryDelta = plan.changes.lambda?.memoryMb || 0;
  const timeoutDelta = plan.changes.lambda?.timeoutSec || 0;
  const estimatedCost = memoryDelta > 0 ? (memoryDelta / 128 * 0.0000000167).toFixed(2) : '0.00';

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Proposed Remediation Plan</h3>
      
      {/* Risk Banner */}
      <div className="bg-emerald-900/30 border border-emerald-700 rounded-md p-3 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-emerald-300 font-medium">Within Safety Guardrails</p>
          <p className="text-emerald-400/80 mt-1">
            Δ memory: +{memoryDelta}MB, Δ timeout: +{timeoutDelta}s, est. cost: +${estimatedCost}/mo
          </p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Intent</h4>
          <p className="text-white">{plan.intent.replace(/_/g, ' ').toUpperCase()}</p>
        </div>

        {plan.changes.lambda && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Lambda Changes</h4>
            <div className="bg-slate-900 rounded p-3 space-y-1 text-sm font-mono">
              {plan.changes.lambda.memoryMb && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory:</span>
                  <span className="text-emerald-400">{plan.changes.lambda.memoryMb} MB</span>
                </div>
              )}
              {plan.changes.lambda.timeoutSec && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Timeout:</span>
                  <span className="text-emerald-400">{plan.changes.lambda.timeoutSec}s</span>
                </div>
              )}
            </div>
          </div>
        )}

        {plan.changes.alarms && plan.changes.alarms.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">New Alarms</h4>
            {plan.changes.alarms.map((alarm, i) => (
              <div key={i} className="bg-slate-900 rounded p-3 text-sm">
                <p className="text-white">{alarm.metric} &gt; {alarm.threshold}</p>
                <p className="text-slate-400">Period: {alarm.periodSec}s</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Verification</h4>
          <p className="text-slate-300 text-sm">{plan.verify.successCriteria}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Notes</h4>
          <p className="text-slate-300 text-sm">{plan.notes}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onProceed}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Proceed with Fix
        </button>
        <button
          onClick={onCancel}
          className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
