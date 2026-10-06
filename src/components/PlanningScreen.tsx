import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface PlanningScreenProps {
  error: string | null;
  onRetry: () => void;
  onBackToProfile?: () => void;
  hasExistingRoadmap?: boolean;
  onViewExistingRoadmap?: () => void;
}

const STEPS = [
  'Understanding your goal',
  'Considering your situation',
  'Building your roadmap',
  'Creating your first steps',
];

export const PlanningScreen: React.FC<PlanningScreenProps> = ({
  error,
  onRetry,
  onBackToProfile,
  hasExistingRoadmap = false,
  onViewExistingRoadmap,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Reset progress when retry is triggered or error cleared
  useEffect(() => {
    if (!error) {
      setActiveStepIndex(0);
      setElapsedSeconds(0);
    }
  }, [error]);

  // Step advancement timer
  useEffect(() => {
    if (error) return;

    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(stepInterval);
  }, [error]);

  // Watchdog timer: counts seconds while loading
  useEffect(() => {
    if (error) return;

    const secondInterval = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    return () => clearInterval(secondInterval);
  }, [error]);

  const isTimedOut = elapsedSeconds >= 24 && !error;

  // Render Error or Watchdog Timeout State
  if (error || isTimedOut) {
    const isRateLimit =
      error?.toLowerCase().includes('busy') ||
      error?.toLowerCase().includes('rate limit') ||
      error?.toLowerCase().includes('demand') ||
      error?.toLowerCase().includes('429');

    const displayTitle = isRateLimit
      ? 'AI Service Temporarily Busy'
      : isTimedOut
      ? 'Plan Generation Took Longer Than Expected'
      : "Couldn't Generate Plan Right Now";

    const displayDescription = isTimedOut
      ? 'The AI planning engine took longer than usual to respond due to network latency or high traffic. Your selections are completely preserved.'
      : error ||
        'The AI service is temporarily busy. Please wait a moment and click Try Again.';

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          {isTimedOut ? (
            <Clock className="w-7 h-7 text-amber-700" />
          ) : (
            <AlertTriangle className="w-7 h-7 text-amber-700" />
          )}
        </div>

        <h3 className="text-xl font-bold text-stone-900 tracking-tight">
          {displayTitle}
        </h3>

        <p className="mt-2.5 text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
          {displayDescription}
        </p>

        {/* Input Preservation Guarantee */}
        <div className="mt-5 p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl text-left flex items-start gap-2.5 max-w-md mx-auto text-xs text-stone-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Inputs Saved:</strong> Your goal, motivation, study hours, and constraints are securely kept in memory. You will not need to retype your information.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          {onBackToProfile && (
            <button
              onClick={onBackToProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 font-medium text-sm hover:bg-stone-50 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Review / Edit Profile</span>
            </button>
          )}
        </div>

        {hasExistingRoadmap && onViewExistingRoadmap && (
          <div className="mt-5">
            <button
              onClick={onViewExistingRoadmap}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Keep existing saved roadmap</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Loading State
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {/* Calm loader icon */}
      <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-stone-200 animate-pulse"></div>
        <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
        Personalizing Your Learning Plan
      </h3>
      <p className="text-xs text-stone-500 mt-1">
        Calibrating for realistic Nepali student schedules, free tools, and constraints.
      </p>

      {/* 4 Steps Checklist */}
      <div className="mt-8 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs text-left space-y-3.5">
        {STEPS.map((stepText, idx) => {
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div
              key={stepText}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                idx <= activeStepIndex ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-stone-300 shrink-0" />
              )}

              <span
                className={`text-sm ${
                  isCurrent
                    ? 'font-bold text-stone-900'
                    : isDone
                    ? 'text-stone-700 font-medium'
                    : 'text-stone-400'
                }`}
              >
                {stepText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status subtext based on elapsed time */}
      <div className="mt-6 text-xs text-stone-500 transition-all">
        {elapsedSeconds < 10 ? (
          <p className="text-stone-400">
            Takes about 5–10 seconds. We're prioritizing your immediate first step.
          </p>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200/60 inline-flex">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Finalizing low-bandwidth resources and step breakdown...</span>
          </div>
        )}
      </div>

      {/* Non-intrusive cancel option if user wants to change mind while loading */}
      {elapsedSeconds > 8 && onBackToProfile && (
        <div className="mt-4">
          <button
            onClick={onBackToProfile}
            className="text-xs text-stone-400 hover:text-stone-600 underline transition-colors cursor-pointer"
          >
            Cancel and adjust profile
          </button>
        </div>
      )}
    </div>
  );
};
