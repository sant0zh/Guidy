import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Target,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  MessageSquare,
  BookOpen,
  Compass,
} from 'lucide-react';
import { Milestone, Roadmap, StudentProfile, Task } from '../types/navigator';
import { ImmediateActionCard } from './ImmediateActionCard';
import { TaskCard } from './TaskCard';

interface DashboardScreenProps {
  roadmap: Roadmap;
  profile: StudentProfile | null;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenAdaptModal: (targetTask?: Task | null) => void;
  onStartNewPlan: () => void;
  onOpenChat?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  roadmap,
  profile,
  onToggleTaskComplete,
  onOpenAdaptModal,
  onStartNewPlan,
}) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>(() => {
    // Expand the first milestone with incomplete tasks by default
    const initial: Record<string, boolean> = {};
    let foundFirstIncomplete = false;

    (roadmap.milestones || []).forEach((m) => {
      const hasIncomplete = (m.tasks || []).some((t) => !t.completed);
      if (hasIncomplete && !foundFirstIncomplete) {
        initial[m.id] = true;
        foundFirstIncomplete = true;
      } else {
        initial[m.id] = false;
      }
    });

    // If all are completed, expand the first one
    if (!foundFirstIncomplete && roadmap.milestones.length > 0) {
      initial[roadmap.milestones[0].id] = true;
    }

    return initial;
  });

  const toggleMilestoneExpand = (milestoneId: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }));
  };

  // Calculate statistics
  let totalTasks = 0;
  let completedTasksCount = 0;
  let nextActionTask: Task | null = null;
  let nextActionMilestoneTitle: string | undefined = undefined;

  for (const m of roadmap.milestones || []) {
    for (const t of m.tasks || []) {
      totalTasks += 1;
      if (t.completed) {
        completedTasksCount += 1;
      } else if (!nextActionTask) {
        nextActionTask = t;
        nextActionMilestoneTitle = m.title;
      }
    }
  }

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const effectiveNextActionTask = nextActionTask
    ? {
        ...nextActionTask,
        decisionTrace:
          nextActionTask.decisionTrace ||
          (completedTasksCount === 0 ? roadmap.firstActionTrace : undefined),
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold uppercase tracking-wider">
              {profile?.goalCategory ? `${profile.goalCategory} Navigator` : 'Active Plan'}
            </span>

            {roadmap.planningMode && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  roadmap.planningMode === 'uncertain'
                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                    : roadmap.planningMode === 'exploring'
                    ? 'bg-sky-50 text-sky-900 border-sky-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                {roadmap.planningMode === 'uncertain'
                  ? 'Discovery Plan (Try Before Commit)'
                  : roadmap.planningMode === 'exploring'
                  ? 'Exploration Plan'
                  : 'Committed Roadmap'}
              </span>
            )}

            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-medium">
              Est. {roadmap.estimatedDuration || '4-6 weeks'}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-1.5">
            {roadmap.goal}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Guidance Chat</span>
            </button>
          )}

          <button
            onClick={() => onOpenAdaptModal(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>I'm Stuck / Adapt</span>
          </button>

          <button
            onClick={onStartNewPlan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-medium text-xs transition-colors cursor-pointer"
            title="Start a new plan"
          >
            <PlusCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Sandbox Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-bold text-stone-800">Roadmap Sandbox</span>
          <span className="text-stone-400">•</span>
          <span>Living route adapted based on ongoing evidence</span>
        </div>

        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="text-stone-700 hover:text-stone-950 font-semibold inline-flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <span>Ask agent to adjust route</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Grounding & Verified Sources Card */}
      {roadmap.resources && roadmap.resources.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Grounded in Sources ({roadmap.resources.length})</span>
            </div>
            {roadmap.groundingNotes && (
              <span className="text-[11px] text-stone-500 italic max-w-sm truncate">
                {roadmap.groundingNotes}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {roadmap.resources.map((res) => (
              <div
                key={res.id}
                className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 truncate">{res.title}</span>
                  <span className="text-[10px] uppercase font-semibold text-stone-500 bg-white border border-stone-200 px-1.5 py-0.2 rounded">
                    {res.type}
                  </span>
                </div>
                {res.content && (
                  <p className="text-[11px] text-stone-500 line-clamp-2 italic">
                    "{res.content}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosed Bottleneck & Reality Calibration */}
      {roadmap.diagnosedBottleneck && (
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 shadow-2xs space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-stone-700" />
            </div>
            <div className="text-xs text-stone-700 leading-relaxed flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-stone-900">Diagnosed Bottleneck:</span>
                {roadmap.diagnosticConfidence && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      roadmap.diagnosticConfidence === 'high'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : roadmap.diagnosticConfidence === 'provisional'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {roadmap.diagnosticConfidence === 'high'
                      ? 'High Confidence'
                      : roadmap.diagnosticConfidence === 'provisional'
                      ? 'Provisional Diagnosis'
                      : 'Testing First / Insufficient Evidence'}
                  </span>
                )}
              </div>
              <p className="text-stone-800">{roadmap.diagnosedBottleneck}</p>
            </div>
          </div>

          {roadmap.desiredVsFeasibleOutcome && (
            <div className="pt-2 border-t border-stone-200/60 text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-lg flex items-start gap-2">
              <span className="font-bold shrink-0">Reality Calibration:</span>
              <span>{roadmap.desiredVsFeasibleOutcome}</span>
            </div>
          )}
        </div>
      )}

      {/* Goal Motivation Insight Callout */}
      {roadmap.goalInsight && (
        <div className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-2xs flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xs text-stone-700 leading-relaxed">
            <span className="font-bold text-stone-900">Strategy Rationale: </span>
            <span>{roadmap.goalInsight}</span>
          </div>
        </div>
      )}

      {/* 2. Adaptation Notice if recently adapted */}
      {roadmap.adaptationNote && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 text-amber-950 flex items-start gap-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-900">Roadmap adapted for you: </span>
            <span>{roadmap.adaptationNote}</span>
            {roadmap.lastAdaptedAt && (
              <span className="text-stone-500 text-[10px] ml-2 block sm:inline">
                (Updated {new Date(roadmap.lastAdaptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Overall Progress Bar Card */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Overall Progress
            </span>
          </div>

          <div className="text-xs text-stone-600">
            <strong className="text-stone-900">{completedTasksCount}</strong> of{' '}
            <strong className="text-stone-900">{totalTasks}</strong> tasks completed ({progressPercentage}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Student Context Badges */}
        {profile && (
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
            <span className="font-semibold text-stone-700">Context:</span>
            {profile.certainty && (
              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                {profile.certainty === 'very_sure'
                  ? 'Very sure'
                  : profile.certainty === 'somewhat_sure'
                  ? 'Somewhat sure'
                  : 'Not sure yet'}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {profile.timePerDay}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {profile.budget}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
              {profile.educationLevel}
            </span>
            {profile.motivation && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 max-w-xs truncate" title={profile.motivation}>
                Why: {profile.motivation}
              </span>
            )}
            {profile.constraints && profile.constraints.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                {profile.constraints[0]}
                {profile.constraints.length > 1 ? ` +${profile.constraints.length - 1} more` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Priority Hero: Immediate Next Action */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Immediate Next Step
          </h3>
          <span className="text-xs text-stone-400">Do this next to maintain momentum</span>
        </div>

        <ImmediateActionCard
          task={effectiveNextActionTask}
          milestoneTitle={nextActionMilestoneTitle}
          onToggleComplete={onToggleTaskComplete}
          onStuck={(t) => onOpenAdaptModal(t)}
        />
      </section>

      {/* 5. Success Definition & Roadmap Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            <Target className="w-3.5 h-3.5" />
            <span>Success Definition</span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            {roadmap.successDefinition}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <span>Plan Summary</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {roadmap.summary}
          </p>
        </div>
      </div>

      {/* 6. Milestones & Task Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Full Roadmap Milestones
          </h3>
          <span className="text-xs text-stone-400">
            {roadmap.milestones.length} Milestones Total
          </span>
        </div>

        <div className="space-y-4">
          {roadmap.milestones.map((milestone, mIdx) => {
            const isExpanded = expandedMilestones[milestone.id];
            const milestoneTasks = milestone.tasks || [];
            const milestoneCompletedCount = milestoneTasks.filter((t) => t.completed).length;
            const isMilestoneComplete =
              milestoneTasks.length > 0 && milestoneCompletedCount === milestoneTasks.length;
            const isCurrentMilestone =
              !isMilestoneComplete &&
              milestoneTasks.some((t) => t.id === nextActionTask?.id);

            return (
              <div
                key={milestone.id}
                className={`rounded-2xl border transition-all ${
                  isCurrentMilestone
                    ? 'bg-white border-amber-400/80 shadow-xs'
                    : isMilestoneComplete
                    ? 'bg-stone-50/60 border-stone-200'
                    : 'bg-white border-stone-200 shadow-2xs'
                }`}
              >
                {/* Milestone Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleMilestoneExpand(milestone.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isMilestoneComplete
                          ? 'bg-emerald-600 text-white'
                          : isCurrentMilestone
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isMilestoneComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        mIdx + 1
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-stone-900 text-base">
                          {milestone.title}
                        </h4>
                        {isCurrentMilestone && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wide">
                            Current Milestone
                          </span>
                        )}
                        {isMilestoneComplete && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wide">
                            Done
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-stone-500 font-medium">
                      {milestoneCompletedCount}/{milestoneTasks.length} tasks
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </button>

                {/* Milestone Tasks */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-stone-100 space-y-2.5">
                    {milestoneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleTaskComplete}
                        onStuck={(t) => onOpenAdaptModal(t)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Realistic Risks & Practical Nepali Mitigations */}
      {roadmap.risks && roadmap.risks.length > 0 && (
        <section className="p-5 rounded-2xl bg-stone-100/70 border border-stone-200 space-y-2.5">
          <div className="flex items-center gap-2 text-stone-800 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Realistic Risks &amp; Mitigations for Nepal</span>
          </div>

          <p className="text-xs text-stone-500">
            Keep these in mind when power, bandwidth, or busy college days interrupt your flow:
          </p>

          <ul className="space-y-1.5 pt-1">
            {roadmap.risks.map((risk, idx) => (
              <li
                key={idx}
                className="text-xs text-stone-700 flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-stone-200/60"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer Info */}
      <div className="pt-6 border-t border-stone-200 text-center text-xs text-stone-400">
        Opportunity &amp; Learning Navigator • v0.1 • Stored locally in your browser
      </div>
    </div>
  );
};
