'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

interface Metric {
  name: string;
  before: number;
  after: number;
  unit: string;
  formatValue?: (val: number) => string;
}

interface MetricsComparisonProps {
  metrics: Metric[];
}

export function MetricsComparison({ metrics }: MetricsComparisonProps) {
  const calculateImprovement = (before: number, after: number) => {
    if (before === 0) return 0;
    return ((before - after) / before) * 100;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Before vs After</h3>
      
      <div className="space-y-4">
        {metrics.map((metric) => {
          const improvement = calculateImprovement(metric.before, metric.after);
          const isImproved = improvement > 0;
          const formatValue = metric.formatValue || ((v) => v.toFixed(1));
          
          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">{metric.name}</span>
                <div className="flex items-center gap-2">
                  {isImproved ? (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-bold ${
                    isImproved ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {isImproved ? '↓' : '↑'} {Math.abs(improvement).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded p-3">
                  <p className="text-xs text-slate-500 mb-1">Before</p>
                  <p className="text-lg font-semibold text-red-400">
                    {formatValue(metric.before)} <span className="text-sm text-slate-500">{metric.unit}</span>
                  </p>
                </div>
                
                <div className="bg-slate-900 rounded p-3">
                  <p className="text-xs text-slate-500 mb-1">After</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {formatValue(metric.after)} <span className="text-sm text-slate-500">{metric.unit}</span>
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isImproved ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(Math.abs(improvement), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
