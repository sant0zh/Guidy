import sys, os
os.chdir(sys.argv[1])
def patch(p, reps):
    s = open(p).read()
    for a, b in reps:
        assert a in s, (p, a[:70])
        s = s.replace(a, b, 1)
    open(p, 'w').write(s)

U = "'Unknown (not stated by the student)'"
patch('server.ts', [
("""      continue;
    }
  }

// Guidance Agent""", """      continue;
    }
  }

  throw lastError ?? new Error('All models failed');
}

// Guidance Agent"""),
("- Goal Category: ${profile.goalCategory}", "- Goal Category: ${profile.goalCategory || " + U + "}"),
("- Certainty / Confidence: \"${profile.certainty}\"", "- Certainty / Confidence: \"${profile.certainty || " + U + "}\""),
("- Education Level: ${profile.educationLevel}", "- Education Level: ${profile.educationLevel || " + U + "}"),
("- Field / Subject Background: ${profile.field}", "- Field / Subject Background: ${profile.field || " + U + "}"),
("- Current Knowledge Level: ${profile.currentKnowledge}", "- Current Knowledge Level: ${profile.currentKnowledge || " + U + "}"),
("- Daily Study Time: ${profile.timePerDay}", "- Daily Study Time: ${profile.timePerDay || " + U + "}"),
("- Budget: ${profile.budget}", "- Budget: ${profile.budget || " + U + "}"),
("- Real-life Constraints: ${Array.isArray(profile.constraints) ? profile.constraints.join(', ') : profile.constraints}",
 "- Real-life Constraints: ${Array.isArray(profile.constraints) && profile.constraints.length > 0 ? profile.constraints.join(', ') : profile.constraints || " + U + "}"),
])

patch('src/utils/api.ts', [
("export async function generateRoadmap(\n  profile: StudentProfile,", "export async function generateRoadmap(\n  profile: Partial<StudentProfile>,"),
("export async function adaptRoadmap(\n  profile: StudentProfile | null,", "export async function adaptRoadmap(\n  profile: Partial<StudentProfile> | null,"),
])

patch('src/utils/storage.ts', [
("  FeedbackEntry,\n", "  FeedbackEntry,\n  GuidanceChatResponse,\n"),
("  contextSufficiency?: ContextSufficiency;\n", "  contextSufficiency?: ContextSufficiency;\n  workingProfile?: Partial<StudentProfile>;\n  readyToMap?: boolean;\n  pendingAdaptation?: GuidanceChatResponse['adaptationFeedback'] | null;\n"),
])

patch('src/components/DashboardScreen.tsx', [
("  onStartNewPlan,\n}) => {", "  onStartNewPlan,\n  onOpenChat,\n}) => {"),
])

patch('src/App.tsx', [
("""import {
  AppScreen,
  ClarificationQuestion,""", """import {
  AppScreen,
  ChatMessage,
  ClarificationQuestion,
  ContextSufficiency,"""),
("""  Task,
} from './types/navigator';""", """  Task,
  GuidanceChatResponse,
  UserResource,
} from './types/navigator';"""),
("""  generateRoadmap,
} from './utils/api';""", """  generateRoadmap,
  sendGuidanceChatMessage,
} from './utils/api';"""),
("import { AdaptModal } from './components/AdaptModal';", """import { AdaptModal } from './components/AdaptModal';
import { GuidanceChatScreen } from './components/GuidanceChatScreen';

type PendingAdaptation = NonNullable<GuidanceChatResponse['adaptationFeedback']>;

const UNKNOWN_VALUES = new Set(['', 'unknown', 'not specified', 'not stated', 'n/a', 'none', 'null', 'undefined']);

// Merge newly extracted profile fields without overwriting known info with empty/unknown values.
function mergeProfile(
  current: Partial<StudentProfile>,
  extracted?: Partial<StudentProfile>
): Partial<StudentProfile> {
  if (!extracted) return current;
  const next: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(extracted)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && UNKNOWN_VALUES.has(value.trim().toLowerCase())) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    next[key] = value;
  }
  return next as Partial<StudentProfile>;
}

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;"""),
("""  // Adapt Modal state""", """  // v0.2 Conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [resources, setResources] = useState<UserResource[]>([]);
  const [contextSufficiency, setContextSufficiency] = useState<ContextSufficiency>('insufficient');
  const [readyToMap, setReadyToMap] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [pendingAdaptation, setPendingAdaptation] = useState<PendingAdaptation | null>(null);
  const [workingProfile, setWorkingProfile] = useState<Partial<StudentProfile>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  // Adapt Modal state"""),
("""    const saved = loadStoredState();
    if (saved) {""", """    const saved = loadStoredState();
    if (saved) {
      setMessages(saved.messages || []);
      setResources(saved.resources || []);
      setContextSufficiency(saved.contextSufficiency || 'insufficient');
      setReadyToMap(!!saved.readyToMap);
      setWorkingProfile(saved.workingProfile || {});
      setPendingAdaptation(saved.pendingAdaptation || null);"""),
("""        setCurrentScreen('goal');
      }
    }
  }, []);""", """        setCurrentScreen('goal');
      } else if (saved.messages && saved.messages.length > 0) {
        setCurrentScreen('conversation');
      }
    }
    setHasLoaded(true);
  }, []);"""),
("""  useEffect(() => {
    saveStateToStorage({
      currentScreen,
      profile,
      roadmap,
      feedbackHistory,
      lastUpdated: new Date().toISOString(),
    });
  }, [currentScreen, profile, roadmap, feedbackHistory]);""", """  useEffect(() => {
    if (!hasLoaded) return; // don't overwrite saved state before it is restored
    saveStateToStorage({
      currentScreen: currentScreen === 'planning' ? (roadmap ? 'dashboard' : 'conversation') : currentScreen,
      profile,
      roadmap,
      feedbackHistory,
      messages,
      resources,
      contextSufficiency,
      workingProfile,
      readyToMap,
      pendingAdaptation,
      lastUpdated: new Date().toISOString(),
    });
  }, [hasLoaded, currentScreen, profile, roadmap, feedbackHistory, messages, resources, contextSufficiency, workingProfile, readyToMap, pendingAdaptation]);"""),
("""  const handleStart = () => {
    setCurrentScreen('goal');
  };""", """  const handleStart = () => {
    setCurrentScreen('conversation');
  };

  // v0.2: Conversation -> Context Sufficiency -> Grounding
  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: makeId('msg'),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setIsResponding(true);

    try {
      const result = await sendGuidanceChatMessage({
        messages: history.map((m) => ({ sender: m.sender, text: m.text })),
        currentProfile: workingProfile,
        currentRoadmap: roadmap,
        resources,
      });

      const agentMessage: ChatMessage = {
        id: makeId('msg'),
        sender: 'agent',
        text: result.reply,
        timestamp: new Date().toISOString(),
        contextSufficiency: result.contextSufficiency,
        missingContext: result.missingContext,
        readyToMap: result.readyToMap,
        suggestedReplies: result.suggestedReplies,
        groundingNotes: result.groundingNotes,
        actionSuggested: result.actionSuggested,
      };
      setMessages((prev) => [...prev, agentMessage]);
      if (result.contextSufficiency) setContextSufficiency(result.contextSufficiency);
      setReadyToMap(!!result.readyToMap);

      setWorkingProfile((prev) => {
        let merged = mergeProfile(prev, result.extractedProfile);
        if (!merged.goalDescription && result.knownContext?.goal) {
          merged = mergeProfile(merged, { goalDescription: result.knownContext.goal });
        }
        if (result.groundingNotes) {
          merged = { ...merged, groundingNotes: result.groundingNotes };
        }
        return merged;
      });

      if (result.actionSuggested === 'adapt_roadmap' && result.adaptationFeedback && roadmap) {
        setPendingAdaptation(result.adaptationFeedback);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId('msg'),
          sender: 'agent',
          text: err?.message || 'Guidy could not respond right now. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsResponding(false);
    }
  };

  const handleAddResource = (resource: UserResource) => {
    setResources((prev) => [...prev, resource]);
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  // v0.2: Conversation -> Roadmap Sandbox (only gathered context; unknowns stay unknown)
  const handleLaunchRoadmap = () => {
    const userWords = messages
      .filter((m) => m.sender === 'user')
      .map((m) => m.text)
      .join(' ');
    const conversationProfile: Partial<StudentProfile> = {
      ...workingProfile,
      goalDescription: workingProfile.goalDescription || userWords,
      resources,
    };
    if (!conversationProfile.goalDescription) return;
    setWorkingProfile(conversationProfile);
    startPlanning(conversationProfile, {});
  };

  // v0.2: Conversation -> Adaptation (reuses existing adaptation machinery)
  const handleApplyChatAdaptation = async (feedback: PendingAdaptation) => {
    if (!roadmap) return;
    setIsResponding(true);
    try {
      const summary = await handleSubmitAdaptation(feedback.category, feedback.notes, feedback.specificTaskId);
      setPendingAdaptation(null);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId('msg'),
          sender: 'agent',
          text: `Your route has been adapted.${summary ? ` ${summary}` : ''} Completed tasks were kept. You can review it in the Roadmap Sandbox.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId('msg'),
          sender: 'agent',
          text: err?.message || 'The route could not be adapted right now. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsResponding(false);
    }
  };"""),
("""  const startPlanning = async (
    targetProfile: StudentProfile,""", """  const startPlanning = async (
    targetProfile: Partial<StudentProfile>,"""),
("""  const handleRetryPlanning = () => {
    if (profile) {
      startPlanning(profile, clarificationAnswers);
    }
  };""", """  const handleRetryPlanning = () => {
    if (profile) {
      startPlanning(profile, clarificationAnswers);
    } else if (workingProfile.goalDescription) {
      startPlanning(workingProfile, {});
    }
  };"""),
("""    const adapted = await adaptRoadmap(
      profile,""", """    const adapted = await adaptRoadmap(
      profile ?? workingProfile,"""),
("""    setFeedbackHistory((prev) => [newFeedbackEntry, ...prev]);
    setRoadmap(adapted);
  };""", """    setFeedbackHistory((prev) => [newFeedbackEntry, ...prev]);
    setRoadmap(adapted);
    return adapted.adaptationNote;
  };"""),
("""    setFeedbackHistory([]);
    setCurrentScreen('goal');
  };""", """    setFeedbackHistory([]);
    setMessages([]);
    setResources([]);
    setContextSufficiency('insufficient');
    setReadyToMap(false);
    setPendingAdaptation(null);
    setWorkingProfile({});
    setCurrentScreen('conversation');
  };"""),
("""        currentScreen={currentScreen}
        onReset""", """        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onReset"""),
("""        {currentScreen === 'goal' && (""", """        {currentScreen === 'conversation' && (
          <GuidanceChatScreen
            messages={messages}
            onSendMessage={handleSendMessage}
            isResponding={isResponding}
            contextSufficiency={contextSufficiency}
            resources={resources}
            onAddResource={handleAddResource}
            onRemoveResource={handleRemoveResource}
            readyToMap={readyToMap}
            onLaunchRoadmap={handleLaunchRoadmap}
            currentRoadmap={roadmap}
            onGoToSandbox={() => roadmap && setCurrentScreen('dashboard')}
            onApplyAdaptation={handleApplyChatAdaptation}
            pendingAdaptation={pendingAdaptation}
          />
        )}

        {currentScreen === 'goal' && ("""),
("""            onBackToProfile={() => setCurrentScreen('profile')}""", """            onBackToProfile={() => setCurrentScreen(profile ? 'profile' : 'conversation')}"""),
("""            profile={profile}
            onToggleTaskComplete""", """            profile={profile ?? (workingProfile as StudentProfile)}
            onToggleTaskComplete"""),
("""            onStartNewPlan={handleReset}
          />""", """            onStartNewPlan={handleReset}
            onOpenChat={() => setCurrentScreen('conversation')}
          />"""),
("onSubmitAdaptation={handleSubmitAdaptation}", "onSubmitAdaptation={async (c, n, t) => { await handleSubmitAdaptation(c, n, t); }}"),
])
print("patched")
