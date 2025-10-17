'use client';

import { CheckCircle, Loader2, Clock, AlertCircle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  detail?: string;
}

interface IncidentProgressProps {
  steps: Step[];
}

export function IncidentProgress({ steps }: IncidentProgressProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Investigation Progress</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3 relative">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'complete' && (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
              {step.status === 'active' && (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              )}
              {step.status === 'pending' && (
                <Clock className="w-5 h-5 text-slate-500" />
              )}
              {step.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            
            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.status === 'complete' ? 'text-emerald-300' :
                step.status === 'active' ? 'text-blue-300' :
                step.status === 'error' ? 'text-red-300' :
                'text-slate-400'
              }`}>
                {step.label}
              </p>
              
              {step.detail && (
                <p className="text-xs text-slate-500 mt-1">{step.detail}</p>
              )}
            </div>
            
            {/* Connecting Line (except last) */}
            {index < steps.length - 1 && (
              <div className="absolute left-[0.625rem] top-8 w-px h-8 bg-slate-700" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
