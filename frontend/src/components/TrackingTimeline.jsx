import React from 'react';
import StatusBadge from './StatusBadge';
import { Calendar, User } from 'lucide-react';

const TrackingTimeline = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-semibold">No tracking logs available.</p>
      </div>
    );
  }

  const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, idx) => (
          <li key={log.id || idx}>
            <div className="relative pb-8">
              {/* Connector */}
              {idx !== logs.length - 1 && (
                <span className="absolute top-5 left-[15px] -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
              )}

              <div className="relative flex gap-3">
                {/* Dot */}
                <div className="shrink-0">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${
                    idx === 0
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md animate-pulse-glow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={log.status} />
                    <span className="text-xs text-slate-400 font-medium">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">{log.actor?.name || 'System'}</span>
                    <span className="text-xs text-slate-400">({log.actor?.role || 'SYSTEM'})</span>
                  </div>

                  {log.note && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-2.5 rounded-xl italic">
                      {log.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrackingTimeline;
