import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, Compass, CheckCircle2, HelpCircle } from 'lucide-react';
import { GoalCategory, GoalCertainty, StudentProfile } from '../types/navigator';

interface StudentProfileScreenProps {
  goalCategory: GoalCategory;
  initialProfile?: StudentProfile | null;
  onSubmit: (profile: StudentProfile) => void;
  onBack: () => void;
}

const EDUCATION_LEVELS = [
  'SEE / Class 10',
  '+2 / High School (Science)',
  '+2 / High School (Management/Commerce)',
  '+2 / High School (Humanities/Law)',
  "Bachelor's (1st - 2nd Year)",
  "Bachelor's (3rd - 4th Year)",
  "Master's Degree",
  'Self-taught / Gap Year / Working',
];

const FIELDS = [
  'Computer Science & IT',
  'Engineering (Civil, Electrical, Mech, etc.)',
  'Management, Commerce & Business',
  'Physical & Life Sciences',
  'Health & Medical Sciences',
  'Humanities, Law & Social Sciences',
  'Design & Creative Arts',
  'Other / Interdisciplinary',
];

const KNOWLEDGE_LEVELS = [
  { id: 'beginner', label: 'Complete Beginner', desc: 'Starting from scratch' },
  { id: 'basic', label: 'Basic Familiarity', desc: 'Know some terms or watched a video' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Know the basics, need structure' },
  { id: 'advanced', label: 'Advanced', desc: 'Deepening specialized mastery' },
] as const;

const TIME_OPTIONS = [
  '30 - 45 mins / day',
  '1 - 2 hours / day',
  '3 - 4 hours / day',
  '5+ hours / day',
];

const BUDGET_OPTIONS = [
  'NPR 0 (Free & open resources only)',
  'Low (under NPR 2,000 for data packs or books)',
  'Moderate (under NPR 10,000)',
  'Flexible',
];

const COMMON_CONSTRAINTS = [
  'Frequent power cuts / load shedding',
  'Limited or metered mobile data (expensive bandwidth)',
  'No personal laptop (studying on phone or shared PC)',
  'English language barrier (prefer simple wording)',
  'Heavy college homework / job pressure',
  'No senior mentor nearby to ask doubts',
];

const CERTAINTY_OPTIONS: { id: GoalCertainty; label: string; desc: string }[] = [
  {
    id: 'very_sure',
    label: 'Very sure',
    desc: 'Generate a committed roadmap directly toward achieving this goal.',
  },
  {
    id: 'somewhat_sure',
    label: 'Somewhat sure',
    desc: 'Progress toward the goal with checkpoints to validate fit along the way.',
  },
  {
    id: 'not_sure_yet',
    label: 'Not sure yet',
    desc: 'Try Before Commit: A low-friction 15-30 min discovery plan before deciding.',
  },
];

export const StudentProfileScreen: React.FC<StudentProfileScreenProps> = ({
  goalCategory,
  initialProfile,
  onSubmit,
  onBack,
}) => {
  const [goalDescription, setGoalDescription] = useState(
    initialProfile?.goalDescription || ''
  );
  const [motivation, setMotivation] = useState(
    initialProfile?.motivation || ''
  );
  const [certainty, setCertainty] = useState<GoalCertainty>(
    initialProfile?.certainty || 'very_sure'
  );
  const [educationLevel, setEducationLevel] = useState(
    initialProfile?.educationLevel || EDUCATION_LEVELS[1]
  );
  const [field, setField] = useState(initialProfile?.field || FIELDS[0]);
  const [currentKnowledge, setCurrentKnowledge] = useState<
    'beginner' | 'basic' | 'intermediate' | 'advanced'
  >(initialProfile?.currentKnowledge || 'beginner');
  const [timePerDay, setTimePerDay] = useState(
    initialProfile?.timePerDay || TIME_OPTIONS[1]
  );
  const [budget, setBudget] = useState(
    initialProfile?.budget || BUDGET_OPTIONS[0]
  );
  const [deadline, setDeadline] = useState(initialProfile?.deadline || '');
  const [constraints, setConstraints] = useState<string[]>(
    initialProfile?.constraints || [COMMON_CONSTRAINTS[1]]
  );
  const [customConstraint, setCustomConstraint] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState(
    initialProfile?.additionalNotes || ''
  );
  const [errorMessage, setErrorMessage] = useState('');

  const toggleConstraint = (item: string) => {
    if (constraints.includes(item)) {
      setConstraints(constraints.filter((c) => c !== item));
    } else {
      setConstraints([...constraints, item]);
    }
  };

  const handleAddCustomConstraint = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customConstraint.trim()) {
      e.preventDefault();
      if (!constraints.includes(customConstraint.trim())) {
        setConstraints([...constraints, customConstraint.trim()]);
      }
      setCustomConstraint('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDescription.trim() || goalDescription.trim().length < 5) {
      setErrorMessage('Please describe your goal with a few specific details.');
      return;
    }
    setErrorMessage('');

    onSubmit({
      goalCategory,
      goalDescription: goalDescription.trim(),
      motivation: motivation.trim() || undefined,
      certainty,
      educationLevel,
      field,
      currentKnowledge,
      timePerDay,
      budget,
      deadline: deadline.trim() || undefined,
      constraints,
      additionalNotes: additionalNotes.trim() || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Goal Selection</span>
      </button>

      {/* Badge & Title */}
      <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md">
        Step 2 of 3
      </span>
      <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-3">
        Your Situation &amp; Planning Profile
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        We collect only what is necessary to build a realistic roadmap tailored to your actual situation and constraints.
      </p>

      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* 1. Goal Description */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
          <label className="block text-sm font-bold text-stone-900">
            What is your specific goal? <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-stone-500">
            Be as honest and plain as you like. For example: "I have a BSc Physics exam in 30 days and I'm weak in differential equations", "Learn Python basics", or "Build my first Android app".
          </p>
          <textarea
            rows={3}
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            placeholder="Type your goal here in your own words..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all"
            required
          />
        </div>

        {/* 2. Motivation: Why is this goal important to you? */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-stone-900">
              Why is this goal important to you?
            </label>
            <span className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">
              Optional
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Helps us tailor the plan toward your actual motivation rather than guessing.
          </p>
          <textarea
            rows={2}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="For example: I need it for university, I want a career in this field, I want to earn money, I’m curious about it, etc."
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all"
          />
        </div>

        {/* 3. Goal Certainty: How sure are you? */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div>
            <label className="block text-sm font-bold text-stone-900">
              How sure are you that this is the goal you actually want?
            </label>
            <p className="text-xs text-stone-500 mt-0.5">
              Determines whether you need a full roadmap or a quick "Try Before Commit" discovery plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {CERTAINTY_OPTIONS.map((opt) => {
              const isSelected = certainty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCertainty(opt.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-600/20 shadow-2xs'
                      : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 hover:bg-stone-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-amber-900' : 'text-stone-800'
                      }`}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Education & Field */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Education Level
            </label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50/50 text-sm text-stone-900 focus:border-stone-900 outline-none cursor-pointer"
            >
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Field / Background
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50/50 text-sm text-stone-900 focus:border-stone-900 outline-none cursor-pointer"
            >
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Knowledge Level */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
            Current Knowledge Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {KNOWLEDGE_LEVELS.map((lvl) => {
              const active = currentKnowledge === lvl.id;
              return (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => setCurrentKnowledge(lvl.id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200 hover:border-stone-300 text-stone-800'
                  }`}
                >
                  <div className="font-semibold text-xs">{lvl.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 leading-tight ${
                      active ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {lvl.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Available Time & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Available Time Per Day
            </label>
            <select
              value={timePerDay}
              onChange={(e) => setTimePerDay(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50/50 text-sm text-stone-900 focus:border-stone-900 outline-none cursor-pointer"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Budget
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-stone-50/50 text-sm text-stone-900 focus:border-stone-900 outline-none cursor-pointer"
            >
              {BUDGET_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7. Deadline (optional) */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Target Deadline (Optional)
            </label>
            <span className="text-[11px] text-stone-400">Leave blank if flexible</span>
          </div>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="e.g. 30 days, 6 weeks, or exam date"
            className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:border-stone-900 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all"
          />
        </div>

        {/* 8. Constraints / Difficulties */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
            Current Constraints &amp; Difficulties
          </label>
          <p className="text-xs text-stone-500">
            Select any real challenges you face so the plan is built around them:
          </p>

          <div className="flex flex-wrap gap-2">
            {COMMON_CONSTRAINTS.map((item) => {
              const active = constraints.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleConstraint(item)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {item}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <input
              type="text"
              value={customConstraint}
              onChange={(e) => setCustomConstraint(e.target.value)}
              onKeyDown={handleAddCustomConstraint}
              placeholder="Add another constraint and press Enter (optional)..."
              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-400 outline-none"
            />
          </div>
        </div>

        {/* 9. Optional Additional Context */}
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Optional Additional Context
            </label>
            <span className="text-[11px] text-stone-400">Optional</span>
          </div>
          <textarea
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="e.g. Can download YouTube videos when visiting campus WiFi, prefer learning in simple English, studying on Android phone..."
            className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:border-stone-900 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all"
          />
        </div>

        {/* Privacy reassurance */}
        <div className="flex items-center gap-2 text-xs text-stone-500 px-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>No personal names, emails, or phone numbers requested. Information is used strictly for plan generation.</span>
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-stone-600 hover:text-stone-900 text-sm font-medium cursor-pointer"
          >
            Back
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
          >
            <span>Review &amp; Generate Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
