import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle, Clock, ShieldAlert, HelpCircle, SplitSquareVertical } from 'lucide-react';
import { FeedbackCategory, Task } from '../types/navigator';

interface AdaptModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTask: Task | null;
  onSubmitAdaptation: (
    category: FeedbackCategory,
    notes: string,
    specificTaskId?: string
  ) => Promise<void>;
}

const CATEGORIES: { id: FeedbackCategory; label: string; desc: string; icon: any }[] = [
  {
    id: 'I failed the diagnostic / got stuck on the check',
    label: 'Diagnostic failed or got stuck',
    desc: 'Attempted the check but encountered errors or could not complete it',
    icon: ShieldAlert,
  },
  {
    id: 'This was too difficult',
    label: 'This was too difficult',
    desc: 'The concepts feel over my head right now; need a gentler ramp',
    icon: HelpCircle,
  },
  {
    id: 'I already know this / too easy',
    label: 'I already know this / too easy',
    desc: 'Can skip the introductory steps and move to real challenges',
    icon: Sparkles,
  },
  {
    id: 'I had less time than expected',
    label: 'I had less time than expected',
    desc: 'College/job got busier, or load shedding cut into study hours',
    icon: Clock,
  },
  {
    id: 'I tried it and disliked it',
    label: 'I tried it and disliked the work',
    desc: 'Doing this felt draining or uninteresting; want to reconsider fit',
    icon: SplitSquareVertical,
  },
  {
    id: 'I got stuck',
    label: 'I got stuck on a bug or tool',
    desc: 'Encountered a roadblock or tool problem and could not proceed',
    icon: HelpCircle,
  },
  {
    id: "I didn't understand the task",
    label: "I didn't understand the instructions",
    desc: 'Directions or resources were confusing or not in simple wording',
    icon: HelpCircle,
  },
  {
    id: 'My goal changed',
    label: 'My goal or direction changed',
    desc: 'Want to pivot focus to a different subject, tool, or career track',
    icon: SplitSquareVertical,
  },
  {
    id: 'Something else',
    label: 'Something else',
    desc: 'Other feedback or general plan recalculation',
    icon: Sparkles,
  },
];

export const AdaptModal: React.FC<AdaptModalProps> = ({
  isOpen,
  onClose,
  targetTask,
  onSubmitAdaptation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>(CATEGORIES[0].id);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmitAdaptation(
        selectedCategory,
        notes.trim(),
        targetTask ? targetTask.id : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adapt plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Adjust My Learning Plan
              </h3>
              <p className="text-xs text-stone-500">
                Hit a roadblock? We'll tailor the remaining steps to your reality.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Task info if triggered from a task */}
        {targetTask && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950">
            <span className="font-semibold text-amber-900">Stuck on task: </span>
            <span className="italic">"{targetTask.title}"</span>
          </div>
        )}

        {/* Safety Note */}
        <div className="mt-3 p-2.5 rounded-lg bg-stone-50 text-[11px] text-stone-500 border border-stone-200/60 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Your completed tasks will remain safely saved. Only the remaining tasks will be adjusted.</span>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              What is making it difficult?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-600 ring-1 ring-amber-600/30'
                        : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-amber-800' : 'text-stone-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-amber-900' : 'text-stone-800'
                        }`}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      {cat.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Tell us more (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Electricity was out for 2 days, or the recommended tool wouldn't install on Windows 10, or college mid-terms started..."
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 outline-none transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adapting Remaining Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Adjust Plan with Gemini</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
