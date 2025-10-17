'use client';

// Type definitions
interface MetricSeries {
  metric: string;
  values: number[];
  timestamps: Date[];
}

interface MetricsChartProps {
  before: MetricSeries[];
  after: MetricSeries[];
}

export function MetricsChart({ before, after }: MetricsChartProps) {
  // Find Errors metric
  const errorsBefore = before.find(m => m.metric === 'Errors');
  const errorsAfter = after.find(m => m.metric === 'Errors');
  
  const errorsBeforeSum = errorsBefore?.values.reduce((a, b) => a + b, 0) || 0;
  const errorsAfterSum = errorsAfter?.values.reduce((a, b) => a + b, 0) || 0;
  const errorsImprovement = errorsBeforeSum > 0 
    ? ((errorsBeforeSum - errorsAfterSum) / errorsBeforeSum * 100).toFixed(1)
    : '0';

  // Find Duration metric
  const durationBefore = before.find(m => m.metric === 'Duration');
  const durationAfter = after.find(m => m.metric === 'Duration');
  
  const durationBeforeAvg = (durationBefore?.values.reduce((a, b) => a + b, 0) || 0) / (durationBefore?.values.length || 1);
  const durationAfterAvg = (durationAfter?.values.reduce((a, b) => a + b, 0) || 0) / (durationAfter?.values.length || 1);
  const durationImprovement = durationBeforeAvg > 0
    ? ((durationBeforeAvg - durationAfterAvg) / durationBeforeAvg * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Errors</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Before:</span>
              <span className="text-red-400 font-semibold">{errorsBeforeSum}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">After:</span>
              <span className="text-emerald-400 font-semibold">{errorsAfterSum}</span>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <span className="text-emerald-400 font-bold text-lg">↓ {errorsImprovement}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Avg Duration (ms)</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Before:</span>
              <span className="text-orange-400 font-semibold">{durationBeforeAvg.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">After:</span>
              <span className="text-emerald-400 font-semibold">{durationAfterAvg.toFixed(0)}</span>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <span className="text-emerald-400 font-bold text-lg">↓ {durationImprovement}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Add sparkline visualization if time permits */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-400 mb-4">Error Trend</h4>
        <div className="h-32 flex items-end gap-1">
          {errorsBefore?.values.slice(-10).map((val, i) => (
            <div 
              key={i}
              className="flex-1 bg-red-500/50 rounded-t"
              style={{ height: `${(val / Math.max(...errorsBefore.values)) * 100}%` }}
            />
          ))}
          <div className="w-px h-full bg-slate-600 mx-2" />
          {errorsAfter?.values.slice(-10).map((val, i) => (
            <div 
              key={i}
              className="flex-1 bg-emerald-500/50 rounded-t"
              style={{ height: `${(val / Math.max(...errorsBefore?.values || [1])) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Before Fix</span>
          <span>After Fix</span>
        </div>
      </div>
    </div>
  );
}
