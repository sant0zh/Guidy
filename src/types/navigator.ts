export type GoalCategory =
  | 'skill'
  | 'exam'
  | 'career'
  | 'project'
  | 'opportunity'
  | 'other';

export type GoalCertainty = 'very_sure' | 'somewhat_sure' | 'not_sure_yet';

export type PlanningMode = 'committed' | 'exploring' | 'uncertain';

export type DiagnosticConfidence = 'high' | 'provisional' | 'insufficient_evidence';

export type ContextSufficiency = 'insufficient' | 'sufficient' | 'grounded_sufficient';

export type GroundingStatus = 'unverified' | 'partially_grounded' | 'verified_source';

export interface UserResource {
  id: string;
  title: string;
  type: 'syllabus' | 'past_paper' | 'textbook' | 'job_post' | 'notes' | 'other';
  content: string;
  fileName?: string;
}

export interface StudentProfile {
  goalCategory: GoalCategory;
  goalDescription: string;
  motivation?: string;
  certainty: GoalCertainty;
  educationLevel: string;
  field: string;
  currentKnowledge: 'beginner' | 'basic' | 'intermediate' | 'advanced';
  timePerDay: string;
  budget: string;
  deadline?: string;
  constraints: string[];
  additionalNotes?: string;
  resources?: UserResource[];
  groundingNotes?: string;
}

export type TaskType = 'read' | 'practice' | 'build' | 'review' | 'exercise' | 'plan';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface InterpretationRule {
  signal: string; // e.g. "Solves 3/3 problems under 15 mins without notes"
  meaning: string; // e.g. "Core equation setup is solid"
  nextDirection: string; // e.g. "Advance directly to non-homogeneous ODEs"
}

export interface DecisionTrace {
  actionPurpose: string; // e.g. "Determine whether bottleneck is formula recognition or algebraic execution"
  diagnosticQuestion: string; // e.g. "Can the student set up the characteristic equation without reference notes?"
  expectedEvidence: string; // e.g. "3 solved past questions with hesitation points circled"
  interpretationRules: InterpretationRule[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  type: TaskType;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  tips?: string;
  decisionTrace?: DecisionTrace;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  tasks: Task[];
}

export interface Roadmap {
  id: string;
  summary: string;
  goal: string;
  diagnosedBottleneck?: string;
  diagnosticConfidence?: DiagnosticConfidence;
  desiredVsFeasibleOutcome?: string;
  planningMode?: PlanningMode;
  goalInsight?: string;
  estimatedDuration: string;
  successDefinition: string;
  firstAction: string;
  firstActionTrace?: DecisionTrace;
  risks?: string[];
  milestones: Milestone[];
  createdAt: string;
  lastAdaptedAt?: string;
  adaptationNote?: string;
  resources?: UserResource[];
  groundingNotes?: string;
}

export type FeedbackCategory =
  | 'I failed the diagnostic / got stuck on the check'
  | 'I already know this / too easy'
  | 'I tried it and disliked it'
  | 'I had less time than expected'
  | 'This was too difficult'
  | 'I got stuck'
  | "I didn't understand the task"
  | 'My goal changed'
  | 'Something else';

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  category: FeedbackCategory;
  notes?: string;
  specificTaskId?: string;
  adaptationSummary?: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  contextReason?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  contextSufficiency?: ContextSufficiency;
  missingContext?: string[];
  readyToMap?: boolean;
  suggestedReplies?: string[];
  groundingNotes?: string;
  actionSuggested?: 'generate_roadmap' | 'adapt_roadmap' | 'none';
}

export interface GuidanceChatResponse {
  reply: string;
  contextSufficiency: ContextSufficiency;
  missingContext: string[];
  knownContext: Record<string, string>;
  extractedProfile?: Partial<StudentProfile>;
  readyToMap: boolean;
  suggestedReplies?: string[];
  groundingNotes?: string;
  actionSuggested?: 'generate_roadmap' | 'adapt_roadmap' | 'none';
  adaptationFeedback?: {
    category: FeedbackCategory;
    notes: string;
    specificTaskId?: string;
  };
}

export type AppScreen =
  | 'conversation'
  | 'dashboard'
  | 'welcome'
  | 'goal'
  | 'profile'
  | 'clarification'
  | 'planning';
