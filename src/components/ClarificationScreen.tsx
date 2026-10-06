import React, { useState } from 'react';
import { ArrowRight, HelpCircle, Check, FastForward } from 'lucide-react';
import { ClarificationQuestion, StudentProfile } from '../types/navigator';

interface ClarificationScreenProps {
  profile: StudentProfile;
  questions: ClarificationQuestion[];
  onConfirm: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export const ClarificationScreen: React.FC<ClarificationScreenProps> = ({
  profile,
  questions,
  onConfirm,
  onSkip,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleCustomChange = (questionId: string, text: string) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: text }));
    if (text.trim()) {
      setAnswers((prev) => ({ ...prev, [questionId]: text.trim() }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(answers);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 md:py-14">
      {/* Header */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-200/80 text-stone-700 text-xs font-semibold mb-3">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Quick Clarification</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
        Help us pinpoint your focus
      </h2>

      <p className="mt-2 text-sm text-stone-600 leading-relaxed">
        Your goal <strong className="text-stone-900">"{profile.goalDescription}"</strong> is a great start! Answering this quick question ensures your tasks are practical and not generic.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {questions.map((q, idx) => {
          const selectedAnswer = answers[q.id];

          return (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="font-bold text-stone-900 text-base">{q.question}</h3>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {q.options.map((opt) => {
                  const isChecked = selectedAnswer === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`w-full p-3 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs font-medium'
                          : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <span>{opt}</span>
                      {isChecked && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Or type custom */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Or write a specific answer..."
                  value={customAnswers[q.id] || ''}
                  onChange={(e) => handleCustomChange(q.id, e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:border-stone-400 outline-none"
                />
              </div>
            </div>
          );
        })}

        {/* Buttons */}
        <div className="pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-medium cursor-pointer transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-stone-400" />
            <span>Skip &amp; Generate Roadmap</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer"
          >
            <span>Generate Roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
