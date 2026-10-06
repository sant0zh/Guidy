import React from 'react';
import { CheckCircle, Clock, Zap, AlertCircle, HelpCircle } from 'lucide-react';
import { Task } from '../types/navigator';

interface ImmediateActionCardProps {
  task: Task | null;
  milestoneTitle?: string;
  onToggleComplete: (taskId: string) => void;
  onStuck: (task: Task) => void;
}

export const ImmediateActionCard: React.FC<ImmediateActionCardProps> = ({
  task,
  milestoneTitle,
  onToggleComplete,
  onStuck,
}) => {
  if (!task) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-emerald-950 text-lg">All tasks completed!</h3>
        <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
          Congratulations! You have completed every milestone in this roadmap. You can review your work or start a new goal.
        </p>
      </div>
    );
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'build':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'practice':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'read':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'review':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-stone-900 text-white p-6 shadow-md border border-stone-800">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-400/30">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Recommended Immediate Action</span>
          </div>

          {milestoneTitle && (
            <span className="text-xs text-stone-400 truncate max-w-xs">
              Part of: <strong className="text-stone-300">{milestoneTitle}</strong>
            </span>
          )}
        </div>

        {/* Task Title */}
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
          {task.title}
        </h3>

        {/* Task Description */}
        <p className="mt-2 text-sm text-stone-300 leading-relaxed font-normal">
          {task.description}
        </p>

        {/* Meta badges: time, type, priority */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{task.estimatedMinutes} mins</span>
          </span>

          <span
            className={`px-2.5 py-1 rounded-md text-xs font-medium border uppercase tracking-wider ${getTypeStyle(
              task.type
            )}`}
          >
            {task.type}
          </span>

          {task.priority === 'high' && (
            <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-medium">
              High Priority
            </span>
          )}
        </div>

        {/* Actionable Verification & Signal */}
        {(task.tips || task.decisionTrace) && (
          <div className="mt-4 p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/80 text-xs text-stone-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1 space-y-2">
              {task.tips && (
                <div>
                  <strong className="text-amber-300 font-semibold">Verification &amp; Next Signal: </strong>
                  {task.tips}
                </div>
              )}

              {task.decisionTrace && (
                <div className="pt-2 border-t border-stone-700/70 space-y-1.5 text-[11px]">
                  {task.decisionTrace.diagnosticQuestion && (
                    <div className="text-stone-300">
                      <span className="text-amber-300 font-semibold">Testing Question: </span>
                      <span>{task.decisionTrace.diagnosticQuestion}</span>
                    </div>
                  )}

                  {task.decisionTrace.expectedEvidence && (
                    <div className="text-stone-300">
                      <span className="text-amber-300 font-semibold">Observable Evidence: </span>
                      <span>{task.decisionTrace.expectedEvidence}</span>
                    </div>
                  )}

                  {task.decisionTrace.interpretationRules && task.decisionTrace.interpretationRules.length > 0 && (
                    <div className="pt-1">
                      <span className="font-semibold text-amber-200 block mb-1">Decision Branches (How this shapes next steps):</span>
                      <ul className="space-y-1 text-stone-300">
                        {task.decisionTrace.interpretationRules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-medium shrink-0">↳ If {rule.signal}:</span>
                            <span>{rule.meaning} → <span className="text-stone-100 font-semibold">{rule.nextDirection}</span></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <CheckCircle className="w-4 h-4 text-stone-950" />
            <span>Mark as Done</span>
          </button>

          <button
            onClick={() => onStuck(task)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>I'm stuck on this</span>
          </button>
        </div>
      </div>
    </div>
  );
};
