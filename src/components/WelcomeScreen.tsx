import React from 'react';
import { Compass, Sparkles, Clock, WifiOff, ArrowRight, RotateCcw } from 'lucide-react';
import { Roadmap } from '../types/navigator';

interface WelcomeScreenProps {
  onStart: () => void;
  existingRoadmap: Roadmap | null;
  onResume: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  existingRoadmap,
  onResume,
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-6">
        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
        <span>v0.1.1 for Students in Nepal</span>
      </div>

      {/* Main Title & Subtitle as requested */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
        Opportunity &amp; Learning Navigator
      </h1>

      <p className="mt-4 text-lg md:text-xl text-stone-600 leading-relaxed font-normal">
        Tell us where you are and where you want to go. We'll help you figure out what to do next.
      </p>

      {/* Value pillars tailored to Nepal students */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Bite-sized Steps</h3>
            <p className="text-xs text-stone-500 mt-1">Realistic 20–45 min tasks so you never feel overwhelmed.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Zero &amp; Low-Cost</h3>
            <p className="text-xs text-stone-500 mt-1">Free resources that work with limited data and electricity.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Adapts When Stuck</h3>
            <p className="text-xs text-stone-500 mt-1">Hit a snag or ran out of time? We adjust without resetting.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-base shadow-sm hover:shadow transition-all cursor-pointer group"
        >
          <span>Start</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {existingRoadmap && (
          <button
            onClick={onResume}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-stone-300 hover:border-stone-400 text-stone-800 font-medium text-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-stone-500" />
            <span>Resume: "{existingRoadmap.goal.slice(0, 28)}{existingRoadmap.goal.length > 28 ? '...' : ''}"</span>
          </button>
        )}
      </div>

      {/* Note about privacy & simplicity */}
      <div className="mt-12 pt-6 border-t border-stone-200 text-xs text-stone-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>No sign-up or phone number needed. Your progress is saved privately on this browser.</span>
      </div>
    </div>
  );
};
