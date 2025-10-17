'use client';

import { AlertTriangle } from 'lucide-react';

export function DemoModeBanner() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  
  if (!isDemoMode) return null;
  
  return (
    <div className="bg-yellow-900/50 border-b border-yellow-700">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-2 text-yellow-300">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Demo Mode: Using seeded test data
          </span>
        </div>
      </div>
    </div>
  );
}
