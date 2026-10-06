import React from 'react';
import { Compass, RotateCcw, MessageSquare, Layers } from 'lucide-react';
import { AppScreen } from '../types/navigator';

interface HeaderProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onReset: () => void;
  hasActivePlan: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onReset,
  hasActivePlan,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-stone-900 text-sm tracking-tight">
              Opportunity &amp; Learning Navigator
            </span>
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest hidden sm:inline">
              v0.2
            </span>
          </div>
        </div>

        {/* Center / Navigation switcher if active plan exists */}
        {hasActivePlan && currentScreen !== 'planning' && (
          <div className="flex items-center p-1 rounded-xl bg-stone-100 border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('conversation')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                currentScreen === 'conversation'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Guidance Chat</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sandbox Map</span>
            </button>
          </div>
        )}

        {/* Right side: New Goal */}
        {currentScreen !== 'welcome' && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Start fresh conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Goal</span>
          </button>
        )}
      </div>
    </header>
  );
};
