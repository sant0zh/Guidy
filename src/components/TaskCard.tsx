import React, { useState } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, Lightbulb, HelpCircle } from 'lucide-react';
import { Task } from '../types/navigator';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onStuck: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onStuck,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'build':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'practice':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'read':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'review':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        task.completed
          ? 'bg-stone-50/80 border-stone-200/60 opacity-75'
          : 'bg-white border-stone-200 shadow-2xs hover:border-stone-300'
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'border-stone-300 hover:border-stone-400 bg-white text-transparent'
          }`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <h4
              className={`text-sm font-semibold text-stone-900 leading-snug ${
                task.completed ? 'line-through text-stone-400' : ''
              }`}
            >
              {task.title}
            </h4>

            {/* Badges */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 text-stone-500 font-medium">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>{task.estimatedMinutes}m</span>
              </span>

              <span
                className={`px-1.5 py-0.5 rounded border uppercase font-medium tracking-wider text-[10px] ${getTypeStyle(
                  task.type
                )}`}
              >
                {task.type}
              </span>
            </div>
          </div>

          <p
            className={`text-xs mt-1 leading-relaxed ${
              task.completed ? 'text-stone-400' : 'text-stone-600'
            }`}
          >
            {task.description}
          </p>

          {/* Action Row */}
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            {(task.tips || task.decisionTrace) ? (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 text-[11px] font-medium cursor-pointer"
              >
                <Lightbulb className="w-3 h-3 text-amber-600" />
                <span>{showDetails ? 'Hide Verification & Details' : 'How to verify & check result'}</span>
                {showDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div />
            )}

            {!task.completed && (
              <button
                type="button"
                onClick={() => onStuck(task)}
                className="inline-flex items-center gap-1 text-stone-400 hover:text-amber-800 text-[11px] font-medium cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Stuck?</span>
              </button>
            )}
          </div>

          {/* Collapsible Verification & Signal */}
          {showDetails && (task.tips || task.decisionTrace) && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                {task.tips && (
                  <div>
                    <span className="font-semibold text-amber-900 block mb-0.5">Verification &amp; Next Signal:</span>
                    <span className="text-stone-700 leading-relaxed block">{task.tips}</span>
                  </div>
                )}

                {task.decisionTrace && (
                  <div className="pt-2 border-t border-amber-200/70 space-y-1 text-[11px]">
                    {task.decisionTrace.diagnosticQuestion && (
                      <div className="text-stone-700">
                        <span className="font-semibold text-amber-950">Testing: </span>
                        <span>{task.decisionTrace.diagnosticQuestion}</span>
                      </div>
                    )}

                    {task.decisionTrace.expectedEvidence && (
                      <div className="text-stone-700">
                        <span className="font-semibold text-amber-950">Observable Evidence: </span>
                        <span>{task.decisionTrace.expectedEvidence}</span>
                      </div>
                    )}

                    {task.decisionTrace.interpretationRules && task.decisionTrace.interpretationRules.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold text-amber-950 block text-[11px] mb-0.5">Branching Outcomes:</span>
                        <ul className="space-y-1 text-[11px] text-stone-700">
                          {task.decisionTrace.interpretationRules.map((rule, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-800 font-bold shrink-0">• If {rule.signal}:</span>
                              <span>{rule.meaning} → <em className="text-stone-900">{rule.nextDirection}</em></span>
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
        </div>
      </div>
    </div>
  );
};
