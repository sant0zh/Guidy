import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Compass,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import {
  ChatMessage,
  ContextSufficiency,
  GuidanceChatResponse,
  Roadmap,
  StudentProfile,
  UserResource,
} from '../types/navigator';

interface GuidanceChatScreenProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isResponding: boolean;
  contextSufficiency: ContextSufficiency;
  resources: UserResource[];
  onAddResource: (resource: UserResource) => void;
  onRemoveResource: (id: string) => void;
  readyToMap: boolean;
  onLaunchRoadmap: () => void;
  currentRoadmap: Roadmap | null;
  onGoToSandbox: () => void;
  onApplyAdaptation?: (feedback: any) => Promise<void>;
  pendingAdaptation?: any;
}

const STARTER_PROMPTS = [
  {
    title: 'BSc Physics Exam',
    desc: 'BSc Physics exam in 30 days, weak in differential equations',
    text: "I have a BSc Physics exam in 30 days and I'm weak in differential equations.",
  },
  {
    title: 'Learn Python',
    desc: 'Want to learn Python for data analysis from scratch',
    text: 'I want to learn Python from scratch for data analysis.',
  },
  {
    title: 'Career Uncertainty',
    desc: "College student, don't know what career track fits me",
    text: "I'm a college student and I don't know what career I actually want.",
  },
  {
    title: 'Internship Search',
    desc: 'Want to get an internship with no prior work experience',
    text: 'I want to get a software or data internship but have no prior experience.',
  },
  {
    title: 'Creative Animation',
    desc: 'Want to make my first animation project on limited time',
    text: 'I want to make my first short animation project with free tools.',
  },
];

export const GuidanceChatScreen: React.FC<GuidanceChatScreenProps> = ({
  messages,
  onSendMessage,
  isResponding,
  contextSufficiency,
  resources,
  onAddResource,
  onRemoveResource,
  readyToMap,
  onLaunchRoadmap,
  currentRoadmap,
  onGoToSandbox,
  onApplyAdaptation,
  pendingAdaptation,
}) => {
  const [inputText, setInputText] = useState('');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState<UserResource['type']>('syllabus');
  const [resourceContent, setResourceContent] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isResponding) return;
    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text);
  };

  const handleQuickPromptClick = async (text: string) => {
    if (isResponding) return;
    await onSendMessage(text);
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceContent.trim()) return;

    onAddResource({
      id: `res-${Date.now()}`,
      title: resourceTitle.trim(),
      type: resourceType,
      content: resourceContent.trim(),
    });

    setResourceTitle('');
    setResourceContent('');
    setShowResourceModal(false);
  };

  const getSufficiencyBadge = () => {
    switch (contextSufficiency) {
      case 'grounded_sufficient':
        return {
          label: 'Grounded in Sources',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          desc: 'Grounded with user-provided syllabus/materials',
        };
      case 'sufficient':
        return {
          label: 'Sufficient Context',
          color: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          desc: 'Ready to map route in sandbox',
        };
      case 'insufficient':
      default:
        return {
          label: 'Gathering Context',
          color: 'bg-stone-100 text-stone-700 border-stone-300',
          dot: 'bg-stone-400',
          desc: 'Understanding your situation & resources',
        };
    }
  };

  const badge = getSufficiencyBadge();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Guidance Bar */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 mb-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 text-xs">Guidance Agent</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}
                title={badge.desc}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                <span>{badge.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Understanding your problem, grounding sources, and sequencing your way forward.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResourceModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200/80 transition-colors cursor-pointer"
            title="Attach syllabus, past papers, notes, or job descriptions"
          >
            <Plus className="w-3.5 h-3.5 text-stone-500" />
            <span>Add Source Material</span>
            {resources.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-white text-[10px] font-bold">
                {resources.length}
              </span>
            )}
          </button>

          {currentRoadmap && (
            <button
              type="button"
              onClick={onGoToSandbox}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>Roadmap Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* User Resources Tray if any exist */}
      {resources.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-stone-100/80 border border-stone-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-stone-600 text-[11px] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            Grounding Sources:
          </span>
          {resources.map((res) => (
            <span
              key={res.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800 text-[11px] shadow-2xs"
            >
              <FileText className="w-3 h-3 text-amber-700" />
              <strong className="font-medium truncate max-w-[140px]">{res.title}</strong>
              <span className="text-stone-400 uppercase text-[9px]">({res.type})</span>
              <button
                type="button"
                onClick={() => onRemoveResource(res.id)}
                className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer"
                title="Remove source"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-stone-900 text-white rounded-br-xs max-w-[85%]'
                    : 'bg-white border border-stone-200/90 text-stone-800 rounded-bl-xs w-full'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-stone-100 text-[11px] font-semibold text-stone-500">
                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                    <span>Guidance Agent</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding note badge */}
                {msg.groundingNotes && (
                  <div className="mt-3 p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-[11px] text-stone-600 flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>{msg.groundingNotes}</span>
                  </div>
                )}

                {/* Ready to map callout */}
                {msg.readyToMap && !currentRoadmap && (
                  <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Ready to Map Your Route</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        We have sufficient context and grounding to generate your sandbox roadmap.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onLaunchRoadmap}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <span>Map Out My Route</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                )}

                {/* Suggested quick replies if this is the last agent message */}
                {!isUser &&
                  index === messages.length - 1 &&
                  msg.suggestedReplies &&
                  msg.suggestedReplies.length > 0 &&
                  !isResponding && (
                    <div className="mt-3 pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-stone-400 mr-1">
                        Suggested:
                      </span>
                      {msg.suggestedReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => {
                            if (reply.toLowerCase().includes('map out') || reply.toLowerCase().includes('generate')) {
                              onLaunchRoadmap();
                            } else {
                              handleQuickPromptClick(reply);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-950 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer border border-stone-200/80"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Adaptation trigger recommendation */}
                {!isUser && msg.actionSuggested === 'adapt_roadmap' && pendingAdaptation && onApplyAdaptation && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 block">Proposed Route Adaptation:</span>
                      <span className="text-[11px] text-stone-700">
                        Category: {pendingAdaptation.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApplyAdaptation(pendingAdaptation)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs cursor-pointer shadow-xs shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Adapted Route</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isResponding && (
          <div className="flex items-center gap-2 text-stone-500 text-xs bg-white border border-stone-200/80 p-3 rounded-xl max-w-xs shadow-2xs">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Guidance Agent is thinking &amp; checking sources...</span>
          </div>
        )}

        {/* Starter situation cards shown if only initial greeting exists */}
        {messages.length <= 1 && !isResponding && (
          <div className="mt-6 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
              Common Situations to Explore:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STARTER_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPromptClick(item.text)}
                  className="p-3 rounded-xl bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 group-hover:text-amber-950">
                      {item.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-800 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-stone-200">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-stone-300 p-2 shadow-xs focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/20 transition-all">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe what you want to achieve, your situation, or what you're stuck on..."
            className="flex-1 bg-transparent resize-none border-none outline-none text-xs md:text-sm text-stone-900 placeholder:text-stone-400 px-2 py-1"
          />

          <div className="flex items-center gap-1.5 pb-1 pr-1">
            <button
              type="button"
              onClick={() => setShowResourceModal(true)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Add syllabus, past questions, or notes"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isResponding}
              className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <Send className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </form>

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Add Authoritative Source Material
                  </h3>
                  <p className="text-xs text-stone-500">
                    Syllabus, past papers, textbook topics, or job descriptions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowResourceModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                  Resource Title
                </label>
                <input
                  type="text"
                  required
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. TU BSc Physics Differential Equations Syllabus"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                  Resource Type
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 bg-white outline-none"
                >
                  <option value="syllabus">Syllabus / Course Outline</option>
                  <option value="past_paper">Past Exam Questions</option>
                  <option value="textbook">Textbook Chapter / Reference</option>
                  <option value="job_post">Job Description / Requirements</option>
                  <option value="notes">Personal Notes / Code Project</option>
                  <option value="other">Other Source</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider text-[10px]">
                  Content / Key Topics / Excerpt
                </label>
                <textarea
                  rows={4}
                  required
                  value={resourceContent}
                  onChange={(e) => setResourceContent(e.target.value)}
                  placeholder="Paste syllabus topics, questions from past papers, or job posting requirements here so the agent can ground the roadmap in verified facts..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Attach Grounding Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
