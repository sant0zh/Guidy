import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Compass, Hammer, Sparkles, HelpCircle } from 'lucide-react';
import { GoalCategory } from '../types/navigator';

interface GoalSelectionScreenProps {
  initialCategory?: GoalCategory;
  onSelectGoal: (category: GoalCategory) => void;
  onBack: () => void;
}

interface GoalOption {
  id: GoalCategory;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'skill',
    title: 'Learn a skill',
    description: 'e.g. Python coding, Figma design, basic accounting, digital marketing',
    icon: BookOpen,
  },
  {
    id: 'exam',
    title: 'Prepare for an exam',
    description: 'e.g. IOE entrance, CMAT/KUUMAT, Lok Sewa Aayog, NEB +2 boards',
    icon: GraduationCap,
  },
  {
    id: 'career',
    title: 'Explore a career direction',
    description: 'Find out what skills, projects, and steps lead to jobs in your area of interest',
    icon: Compass,
  },
  {
    id: 'project',
    title: 'Build a project',
    description: 'Turn an idea or assignment into a working portfolio piece or app',
    icon: Hammer,
  },
  {
    id: 'opportunity',
    title: 'Prepare for an opportunity',
    description: 'Get ready for an upcoming college application, hackathon, or interview',
    icon: Sparkles,
  },
  {
    id: 'other',
    title: 'Something else',
    description: 'Any personal, academic, or self-directed learning aspiration',
    icon: HelpCircle,
  },
];

export const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({
  initialCategory,
  onSelectGoal,
  onBack,
}) => {
  const [selected, setSelected] = useState<GoalCategory | null>(initialCategory || null);

  const handleContinue = () => {
    if (selected) {
      onSelectGoal(selected);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-14">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Screen step badge */}
      <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md">
        Step 1 of 3
      </span>

      {/* Primary Question as specified */}
      <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight mt-3">
        What are you trying to accomplish?
      </h2>
      <p className="mt-2 text-stone-600 text-base">
        Choose the category that best matches your target right now.
      </p>

      {/* Options grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {GOAL_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${
                isSelected
                  ? 'bg-amber-50/60 border-amber-600 ring-2 ring-amber-600/20 shadow-xs'
                  : 'bg-white border-stone-200/90 hover:border-stone-300 hover:bg-stone-50/50 shadow-xs'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <div className="font-semibold text-stone-900 text-base flex items-center justify-between">
                  <span>{opt.title}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer continue action */}
      <div className="mt-10 flex items-center justify-between pt-6 border-t border-stone-200">
        <p className="text-xs text-stone-500">
          {selected ? 'Category selected. Click continue.' : 'Select one option to continue.'}
        </p>

        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            selected
              ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
