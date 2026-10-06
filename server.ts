import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PLANNING_ENGINE_SYSTEM_PROMPT = `
You are the intelligence engine of Guidy / Opportunity & Learning Navigator (v0.1.6), an expert educational strategist, diagnostic coach, and action planner for students in Nepal.

# PRIMARY OBJECTIVE:
Your mission is to understand the student's ACTUAL problem, distinguish the stated goal from the underlying bottleneck, and generate an intelligent, adaptive guidance loop:
DIAGNOSTIC ACTION → OBSERVED RESULT → INTERPRETATION → BRANCHING DECISION → NEXT ACTION.

# THREE CRUCIAL DISTINCTIONS:
Never conflate:
1. GOAL: What the user says they want (e.g., "I want to learn Python", "Pass my exam", "Get an internship").
2. BOTTLENECK: What is actually preventing progress (e.g., no execution environment, syntax confusion, inability to decompose problems, exam pattern unfamiliarity, timed anxiety, no proof of ability, social comparison, action deficit masked by productivity videos).
3. NEXT ACTION: The smallest useful intervention that can reveal or improve the bottleneck.
Do NOT assume "I want X" means "I need to learn everything required for X from scratch."

# DIAGNOSTIC CONFIDENCE:
Internally evaluate your confidence in the bottleneck:
- "high": Clear evidence exists from the student's explicit history (e.g., failed a specific test section twice, already built scripts).
- "provisional": Reasonable hypothesis based on stated background and common failure modes.
- "insufficient_evidence": Not enough data yet to know the true cause (e.g., "I can't learn Python", "I want a good career").
When evidence is insufficient or provisional, Guidy is comfortable saying: "We don't know yet whether the issue is X or Y; let's test that directly with this first exercise."

# CRITICAL SITUATION EVALUATION (TESTING THE STATED GOAL):
The user's stated goal is NOT treated as unquestionable truth. Detect and address:
- SOCIAL COMPARISON ("My friends are doing it and I feel behind"): Do not prescribe a massive curriculum. Test whether they actually enjoy the work enabled by the skill via a 20-min micro-experiment.
- WRONG PROBLEM ("I keep watching productivity videos but never actually study"): Do not prescribe productivity tips. Identify the action gap (consumption disguised as progress) and prescribe an immediate 10-15 min active non-negotiable step. No lecturing or over-psychologizing.
- CONTRADICTORY CONSTRAINTS (e.g., "5-minute professional animation in 1 month, 20 mins/day, phone only, zero budget"): Explicitly distinguish DESIRED OUTCOME from CURRENTLY FEASIBLE OUTCOME in "desiredVsFeasibleOutcome". Propose a 3-second proof-of-capability target without being dismissive.
- ALREADY KNOWS BASICS ("Already know Python syntax, want real problem solving"): Skip introductory syntax completely. Jump straight to problem decomposition and project execution.
- EXAM FAILURE ("Failed twice, exam in 20 days"): Triage! Do not assign the full syllabus. Isolate whether the blocker is formula recall, equation classification, or algebra execution.
- UNCLEAR GOAL ("I want a good career"): Narrow choices by testing 2 contrasting everyday tasks rather than guessing.

# CORE ANTI-TEMPLATE PRINCIPLE:
Do NOT force every user into a rigid "learn fundamentals -> practice -> build -> review" template!
1. EXAM PREPARATION: Diagnostic triage -> isolate exact error lines on past papers -> high-yield drills -> timed exam simulations -> targeted repair.
2. LEARNING A SKILL: Immediate low-friction hands-on creation -> early syntax/tool friction in first 20 mins -> isolate misunderstanding -> build something slightly harder.
3. CAREER UNCERTAINTY: Contrast 2-3 realistic career hypotheses -> audit real entry-level job posts -> run 30-45 min micro-trials of daily tasks -> reflect on flow vs. friction -> narrowing decision.
4. CREATIVE PROJECT: Strict scope containment (3-5 second motion loop, NOT a 5-min film) -> zero-cost/mobile tool triage -> thumbnail storyboard -> rough pass -> polish & export.
5. OPPORTUNITY / INTERNSHIP: Determine what proof employers need -> build 1 undeniable proof-of-work artifact -> project-led CV -> targeted outreach -> feedback loop.

# ACTION QUALITY & BRANCHING DECISION TRACE:
For the immediate next action and each major task:
- State WHAT, WHY NOW, and HOW clearly in "description".
- Provide "Evidence of progress" and "Next signal" in "tips".
- Provide structured "decisionTrace" containing:
  * actionPurpose: What we are testing or building.
  * diagnosticQuestion: The exact question this action answers about the user.
  * expectedEvidence: The concrete observable artifact or behavior.
  * interpretationRules: Array of 2-3 branching rules:
    { "signal": "...", "meaning": "...", "nextDirection": "..." }

# IMMEDIATE FIRST ACTION ("firstAction"):
- Must take 10-30 minutes TODAY.
- Must be active DOING using available resources (paper, phone browser, zero budget).
- Must produce DIAGNOSTIC EVIDENCE that determines which branch the plan takes.

# REALISTIC CONSTRAINTS & ZERO HALLUCINATIONS:
- Only apply constraints (metered data, power cuts, limited hours) when directly relevant to the user's plan.
- Do NOT generate generic boilerplate risk paragraphs. If the student has no special constraints, leave risks empty.
- ZERO HALLUCINATIONS: Never invent fake URLs, fake scholarships, non-existent organizations, or fictional deadlines. Mention categories of resources (e.g. "free browser sandbox", "TU past year papers").
`;

// Helpers for robust error classification and JSON parsing
function classifyError(error: any): { status: number; message: string; code: string } {
  const msg = String(error?.message || '');
  const status = error?.status || error?.statusCode;

  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota exceeded') ||
    msg.includes('rate limit')
  ) {
    return {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'The AI planning service is currently experiencing high demand. Please click Try Again in a moment.',
    };
  }

  if (
    status === 504 ||
    msg.includes('Timeout') ||
    msg.includes('timed out') ||
    msg.includes('deadline exceeded')
  ) {
    return {
      status: 504,
      code: 'TIMEOUT',
      message: 'Generating your learning plan took longer than expected. Please click Try Again.',
    };
  }

  if (
    status === 503 ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('temporarily unavailable') ||
    msg.includes('Service Unavailable')
  ) {
    return {
      status: 503,
      code: 'SERVICE_BUSY',
      message: 'The AI planning engine is temporarily busy. Please click Try Again.',
    };
  }

  return {
    status: 500,
    code: 'GENERATION_ERROR',
    message: 'Failed to generate learning plan. Please click Try Again.',
  };
}

function extractJsonFromText(rawText: string): any {
  let cleaned = (rawText || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

const decisionTraceSchema = {
  type: Type.OBJECT,
  properties: {
    actionPurpose: {
      type: Type.STRING,
      description: 'The exact diagnostic purpose or skill capability being tested',
    },
    diagnosticQuestion: {
      type: Type.STRING,
      description: 'The precise question this action answers about the user (e.g. Can they set up characteristic equations without notes?)',
    },
    expectedEvidence: {
      type: Type.STRING,
      description: 'The observable tangible proof or artifact produced (e.g. 3 solved problems with hesitation points circled, or running code printing 5 items)',
    },
    interpretationRules: {
      type: Type.ARRAY,
      description: '2 to 3 branching decision rules: if signal -> meaning -> next direction',
      items: {
        type: Type.OBJECT,
        properties: {
          signal: { type: Type.STRING },
          meaning: { type: Type.STRING },
          nextDirection: { type: Type.STRING },
        },
        required: ['signal', 'meaning', 'nextDirection'],
      },
    },
  },
  required: ['actionPurpose', 'diagnosticQuestion', 'expectedEvidence', 'interpretationRules'],
};

// Resilient, bounded Gemini caller with strict per-call and total timeouts
async function generateContentWithRetry(params: {
  contents: string;
  config: any;
  preferredModel?: string;
  perCallTimeoutMs?: number;
  totalTimeoutMs?: number;
}) {
  const perCallTimeoutMs = params.perCallTimeoutMs || 12000; // 12s per call
  const totalTimeoutMs = params.totalTimeoutMs || 25000; // 25s total max
  const startTime = Date.now();

  const candidateModels = [
    params.preferredModel || 'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  const uniqueModels = Array.from(new Set(candidateModels));
  let lastError: any = null;

  for (const model of uniqueModels) {
    const elapsed = Date.now() - startTime;
    if (elapsed > totalTimeoutMs - 2500) {
      const timeoutErr: any = new Error(`Planning request reached timeout limit (${totalTimeoutMs}ms).`);
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }

    try {
      let timer: NodeJS.Timeout | null = null;
      const callPromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          const err: any = new Error(`Request to ${model} timed out after ${perCallTimeoutMs}ms`);
          err.statusCode = 504;
          reject(err);
        }, perCallTimeoutMs);
      });

      const response: any = await Promise.race([callPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);
      return response;
    } catch (err: any) {
      lastError = err;
      // On 429, 503 (high demand), or timeout, immediately advance to the next candidate model
      continue;
    }
  }

// Guidance Agent System Prompt & Schema
const GUIDANCE_AGENT_SYSTEM_PROMPT = `
You are the Conversational Guidance Agent of Opportunity & Learning Navigator (v0.2).
You are helping students, jobseekers, and self-learners in Nepal and beyond figure out their way forward.

# CORE IDENTITY & PURPOSE:
- You are a strategic navigator, diagnostician, and sequencing guide.
- You are NOT an AI tutor, NOT an academic lecturer, and NOT an omniscient factual textbook.
- Your purpose is: HELP A PERSON FIGURE OUT THEIR WAY FORWARD.
- If the user asks for direct technical explanations (e.g. "What is an exact differential equation?"), give a concise 1-2 sentence orientation, then clearly clarify: "Your textbook and teacher are the authoritative sources for the formal theory and proofs. Here is where it fits into your roadmap and what observable skill you should achieve."

# CRITICAL SOURCE & KNOWLEDGE BOUNDARY (FOUNDATIONAL RULE):
Separate two distinct domains:
1. GENERAL REASONING KNOWLEDGE:
   - Sequencing, planning principles, diagnostic tests, micro-trials, identifying missing context, constraint management, time auditing. You excel at this!
2. VERIFIED / AUTHORITATIVE FACTUAL KNOWLEDGE:
   - Specific university syllabus topics, exact exam content, recurring past question patterns, official admission requirements, live job openings, scholarship deadlines, specialized professional regulations.
   - NEVER FABRICATE OR GUESS THESE!
   - "SPECIFIC ABOUT ACTIONS, GENERAL ABOUT UNSUPPORTED FACTS":
     * BAD: "Your BSc Physics exam tests separable, linear, and exact ODEs." (Unverified invention)
     * GOOD: "Take three differential equation questions from your actual syllabus, textbook, or past papers. For each, identify the method you think it requires." (Specific action grounded in user source)
     * BAD: "Companies in Kathmandu always require Django and React."
     * GOOD: "Let's inspect several active job postings for the role and extract the recurring requirements."
   - If factual sources are needed and not yet provided:
     Acknowledge it plainly: "I don't have your syllabus or past papers yet, so I won't pretend to guess the exact exam scope. If you have them, share excerpts here. In the meantime, we can formulate a general diagnostic strategy."

# CONTEXT SUFFICIENCY:
Continuously evaluate: "What do I still need to know before I can responsibly recommend a route?"
States:
- "insufficient": The user's input lacks essential dimensions (e.g. they only stated "I want to learn Python" or "I want to pass physics"). Ask 1-2 high-leverage questions to uncover purpose, background, time available, or sources. Do NOT ask an endless survey!
- "sufficient": You understand their goal, motivation, background level, available time/deadline, and key constraints. You have enough to generate a structured, tailored roadmap.
- "grounded_sufficient": In addition to sufficient context, the user has provided or referenced verified source materials (e.g. syllabus notes, past questions, job posts).

# READINESS TO MAP:
When context is "sufficient" or "grounded_sufficient", set readyToMap: true.
Invite the user warmly: "I have enough context to structure your route. Ready to map this into your sandbox, or is there anything else you want to share first?"

# POST-ROADMAP CONVERSATION & ADAPTATION:
If the user already has a roadmap (provided in currentRoadmap context) and reports back:
- "I'm stuck on task..." -> Diagnose whether the obstacle is conceptual, execution, or environment. Set actionSuggested: "adapt_roadmap" with appropriate feedbackCategory.
- "This was too easy / already know this" -> Set actionSuggested: "adapt_roadmap" with category "I already know this / too easy" to accelerate.
- "I had less time / load shedding / exams" -> Set actionSuggested: "adapt_roadmap" with category "I had less time than expected".
- "I tried it and disliked it" or "My goal changed" -> Acknowledge the preference signal calmly, pivot direction while preserving past work!

# SUGGESTED REPLIES:
Provide 2 to 4 short, helpful button-like options (under 8 words each) that make it fast for the user to respond without typing.
`;

const guidanceChatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    contextSufficiency: {
      type: Type.STRING,
      enum: ['insufficient', 'sufficient', 'grounded_sufficient'],
    },
    missingContext: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    knownContext: {
      type: Type.OBJECT,
      properties: {
        goal: { type: Type.STRING },
        motivation: { type: Type.STRING },
        educationLevel: { type: Type.STRING },
        field: { type: Type.STRING },
        currentKnowledge: { type: Type.STRING },
        timePerDay: { type: Type.STRING },
        deadline: { type: Type.STRING },
        constraints: { type: Type.STRING },
        resources: { type: Type.STRING },
      },
    },
    extractedProfile: {
      type: Type.OBJECT,
      properties: {
        goalCategory: {
          type: Type.STRING,
          enum: ['skill', 'exam', 'career', 'project', 'opportunity', 'other'],
        },
        goalDescription: { type: Type.STRING },
        motivation: { type: Type.STRING },
        certainty: {
          type: Type.STRING,
          enum: ['very_sure', 'somewhat_sure', 'not_sure_yet'],
        },
        educationLevel: { type: Type.STRING },
        field: { type: Type.STRING },
        currentKnowledge: {
          type: Type.STRING,
          enum: ['beginner', 'basic', 'intermediate', 'advanced'],
        },
        timePerDay: { type: Type.STRING },
        budget: { type: Type.STRING },
        deadline: { type: Type.STRING },
        constraints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        groundingNotes: { type: Type.STRING },
      },
      required: ['goalCategory', 'goalDescription'],
    },
    readyToMap: { type: Type.BOOLEAN },
    suggestedReplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    groundingNotes: { type: Type.STRING },
    actionSuggested: {
      type: Type.STRING,
      enum: ['generate_roadmap', 'adapt_roadmap', 'none'],
    },
    adaptationFeedback: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          enum: [
            'I failed the diagnostic / got stuck on the check',
            'I already know this / too easy',
            'I tried it and disliked it',
            'I had less time than expected',
            'This was too difficult',
            'I got stuck',
            "I didn't understand the task",
            'My goal changed',
            'Something else',
          ],
        },
        notes: { type: Type.STRING },
        specificTaskId: { type: Type.STRING },
      },
      required: ['category', 'notes'],
    },
  },
  required: ['reply', 'contextSufficiency', 'missingContext', 'readyToMap', 'suggestedReplies'],
};

// 0. Conversational Guidance Agent Endpoint
app.post('/api/guidance-chat', async (req: Request, res: Response) => {
  try {
    const { messages, currentProfile, currentRoadmap, resources } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const conversationTranscript = messages
      .map((m: any) => `${m.sender === 'user' ? 'User' : 'Guidance Agent'}: ${m.text}`)
      .join('\n');

    const resourcesText =
      Array.isArray(resources) && resources.length > 0
        ? resources
            .map((r: any) => `[${(r.type || 'resource').toUpperCase()}] ${r.title}: ${r.content || ''}`)
            .join('\n---\n')
        : 'No authoritative source materials provided yet.';

    const activeRoadmapContext = currentRoadmap
      ? `Active Roadmap Context in Sandbox:
- Goal: "${currentRoadmap.goal}"
- Diagnosed Bottleneck: "${currentRoadmap.diagnosedBottleneck || 'N/A'}" (${currentRoadmap.diagnosticConfidence || 'provisional'})
- Immediate Next Action: "${currentRoadmap.firstAction}"
- Milestones: ${(currentRoadmap.milestones || [])
          .map(
            (m: any) =>
              `${m.title} (${(m.tasks || []).filter((t: any) => t.completed).length}/${(m.tasks || []).length} tasks done)`
          )
          .join(', ')}`
      : 'No active roadmap in sandbox yet.';

    const knownProfileContext = currentProfile
      ? `Extracted Profile So Far: ${JSON.stringify(currentProfile)}`
      : 'No profile extracted yet.';

    const prompt = `
A student is having a guidance conversation with you. Respond thoughtfully according to your core instructions.

CONVERSATION TRANSCRIPT:
${conversationTranscript}

USER-PROVIDED RESOURCES & SOURCES:
${resourcesText}

CURRENT STATE:
${knownProfileContext}
${activeRoadmapContext}

Remember:
1. Ground truth boundary: Never invent specific syllabus topics, exam patterns, or job posts without sources. Be specific about actions, general about unsupported facts.
2. Ask only 1-2 essential questions if context is insufficient.
3. If context is sufficient or grounded_sufficient, set readyToMap to true, suggest "Map out my route", and summarize readiness.
4. If the user is reporting feedback/stuck on an active roadmap, analyze what happened, suggest the adaptation category, and set actionSuggested to "adapt_roadmap".
`;

    const response = await generateContentWithRetry({
      preferredModel: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: GUIDANCE_AGENT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: guidanceChatResponseSchema,
      },
    });

    const parsed = extractJsonFromText(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/guidance-chat:', error);
    const { status, message, code } = classifyError(error);
    return res.status(status).json({
      error: message,
      code,
      details: error.message,
    });
  }
});

// 1. Clarification Endpoint
app.post('/api/clarify-goal', async (req: Request, res: Response) => {
  try {
    const { goalCategory, goalDescription, motivation, certainty, educationLevel, field } = req.body;

    if (!goalDescription || goalDescription.trim().length < 3) {
      return res.json({ needsClarification: false, questions: [] });
    }

    const prompt = `
Evaluate the following student's goal to decide if it is too broad or ambiguous for creating an actionable daily plan:
- Category: ${goalCategory}
- Goal: "${goalDescription}"
- Motivation: "${motivation || 'Not specified'}"
- Certainty: "${certainty || 'Not specified'}"
- Education: ${educationLevel}
- Field: ${field}

Rules:
1. If the goal is specific enough (e.g. "Pass IOE entrance physics mechanics", "Build a portfolio website in HTML/CSS", "Learn Python basics for data analysis in 2 months"), then needsClarification is false.
2. If certainty is "not_sure_yet", do NOT interrogate them with advanced technical questions; instead keep clarification minimal or set needsClarification to false so they can start their discovery experiment.
3. If the goal is very broad (e.g. "I want to do IT", "Learn coding", "Prepare for exam", "Get a good job"), return 1 or maximum 2 concise, multiple-choice clarification questions to help narrow down the focus.
Each question must have 3 to 4 short, distinct options suitable for a Nepali student context.
`;

    const response = await generateContentWithRetry({
      preferredModel: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: PLANNING_ENGINE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needsClarification: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'question', 'options'],
              },
            },
          },
          required: ['needsClarification'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/clarify-goal:', error);
    // Graceful fallback so student is never blocked
    return res.json({ needsClarification: false, questions: [] });
  }
});

// 2. Generate Roadmap Endpoint
app.post('/api/generate-roadmap', async (req: Request, res: Response) => {
  try {
    const { profile, clarificationAnswers } = req.body;

    if (!profile || !profile.goalDescription) {
      return res.status(400).json({ error: 'Missing student profile or goal' });
    }

    const certaintyMode =
      profile.certainty === 'very_sure'
        ? 'committed'
        : profile.certainty === 'somewhat_sure'
        ? 'exploring'
        : 'uncertain';

    const prompt = `
Generate a deeply tailored, realistic, and situation-specific action plan for this student in Nepal.

Student Profile:
- Goal Category: ${profile.goalCategory}
- Stated Goal: "${profile.goalDescription}"
- Motivation / Core Reason: "${profile.motivation || 'Not explicitly provided'}"
- Certainty / Confidence: "${profile.certainty}" (Planning Mode: ${certaintyMode})
- Clarification / Refinements: ${clarificationAnswers ? JSON.stringify(clarificationAnswers) : 'None'}
- Education Level: ${profile.educationLevel}
- Field / Subject Background: ${profile.field}
- Current Knowledge Level: ${profile.currentKnowledge}
- Daily Study Time: ${profile.timePerDay}
- Budget: ${profile.budget}
- Target Deadline: ${profile.deadline || 'Flexible / As soon as feasible'}
- Real-life Constraints: ${Array.isArray(profile.constraints) ? profile.constraints.join(', ') : profile.constraints}
- Additional Context / Notes: ${profile.additionalNotes || 'None'}
- Grounding & Source Notes: "${profile.groundingNotes || 'None'}"
- User-Provided Authoritative Resources:
${
  Array.isArray(profile.resources) && profile.resources.length > 0
    ? profile.resources
        .map((r: any) => `[${(r.type || 'resource').toUpperCase()}] ${r.title}: ${r.content || ''}`)
        .join('\n---\n')
    : 'No verified syllabus/textbook provided. Rely strictly on general learning principles without inventing specific university exam scope.'
}

PLANNING STRATEGY & INSTRUCTIONS:
1. UNDERSTAND THE REAL PROBLEM & DISTINGUISH:
   - Stated Goal: What the user says they want.
   - Bottleneck ("diagnosedBottleneck"): What is ACTUALLY preventing progress (e.g. action deficit masked by tutorial watching, syntax confusion vs problem decomposition, timed recall anxiety under exam constraints, missing proof-of-work artifact).
     Do NOT simply rephrase the stated goal. Explicitly state the underlying diagnostic obstacle.
   - Diagnostic Confidence ("diagnosticConfidence"):
     * "high": Clear historical evidence (e.g., student explicitly reports having failed twice or already knows syntax).
     * "provisional": Working hypothesis based on student background and common failure modes.
     * "insufficient_evidence": Not enough data yet (prefer starting with a diagnostic check to find out).
   - If constraints conflict with ambition (e.g. 5-minute animation in 30 days with 20 mins/day, or failing exam in 20 days), calibrate the goal in "desiredVsFeasibleOutcome" without being dismissive.

2. STRUCTURE SELECTION (NO GENERIC "LEARN -> PRACTICE -> BUILD" TEMPLATES):
   - Exam Preparation: Diagnostic triage -> isolate exact error lines on past papers -> high-yield problem patterns -> timed simulations -> targeted repair.
   - Learning a Skill: Immediate micro-creation -> early friction in 20 mins -> repair mental model -> build progressively harder artifacts.
   - Career Uncertainty: Contrast 2-3 realistic paths -> audit entry-level job posts -> 30-40 min micro-trials of actual role tasks -> reflect on flow vs friction -> evidence-based narrowing.
   - Creative Project: Strict scope containment -> zero-cost/mobile tools -> storyboard/blocking -> critique -> render.
   - Internship/Opportunity: Identify employer proof requirement -> create 1 undeniable proof-of-work artifact -> project-led CV -> targeted outreach.

3. IMMEDIATE FIRST ACTION ("firstAction" & "firstActionTrace"):
   - Must take 10-30 minutes TODAY using free/accessible tools.
   - Must be active DOING (not passive reading).
   - Must produce DIAGNOSTIC EVIDENCE that directly determines which branch the plan takes.
   - Provide "firstActionTrace":
     * actionPurpose: What capability/blocker we are testing.
     * diagnosticQuestion: The exact question answered.
     * expectedEvidence: Observable artifact or behavior.
     * interpretationRules: At least 2 branching outcomes (e.g. if solves easily -> advance; if errors -> repair branch).
   - CRITICAL REQUIREMENT: The very first task of Milestone 1 (order 1, task 1) MUST BE this immediate action, with its decisionTrace matching firstActionTrace!

4. MILESTONES & TASKS:
   - 2 to 5 milestones tailored to the domain.
   - Milestone titles and descriptions must explain the strategic phase.
   - Prefer fewer highly specific actions over many vague ones.
   - For every task:
     * title: Short, concrete action title.
     * description: Concrete WHAT, WHY NOW, and HOW to execute with accessible tools.
     * tips: Must contain explicit "Evidence of progress: [observable result]. Next signal: [what this outcome indicates you should focus on next]."
     * estimatedMinutes: Duration matching daily study time (${profile.timePerDay}).
     * decisionTrace: For key tasks, provide structured purpose, diagnostic question, expected evidence, and branching rules.

5. GOAL INSIGHT & MOTIVATION:
   - Provide "goalInsight" explaining why this structure matches their motivation ("${profile.motivation || 'their stated interest'}") and certainty level (${certaintyMode}).

6. REALISTIC CONSTRAINTS & RISKS:
   - Only include "risks" if directly relevant to the student's constraints (e.g. power cuts, metered data). If no special constraints, return [].
   - ZERO HALLUCINATIONS: No fake URLs, fake scholarships, or fictional organizations.
`;

    const response = await generateContentWithRetry({
      preferredModel: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: PLANNING_ENGINE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planningMode: {
              type: Type.STRING,
              enum: ['committed', 'exploring', 'uncertain'],
            },
            goalInsight: { type: Type.STRING },
            diagnosedBottleneck: { type: Type.STRING },
            diagnosticConfidence: {
              type: Type.STRING,
              enum: ['high', 'provisional', 'insufficient_evidence'],
            },
            desiredVsFeasibleOutcome: { type: Type.STRING },
            summary: { type: Type.STRING },
            goal: { type: Type.STRING },
            estimatedDuration: { type: Type.STRING },
            successDefinition: { type: Type.STRING },
            firstAction: { type: Type.STRING },
            firstActionTrace: decisionTraceSchema,
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  order: { type: Type.INTEGER },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        estimatedMinutes: { type: Type.INTEGER },
                        type: {
                          type: Type.STRING,
                          enum: ['read', 'practice', 'build', 'review', 'exercise', 'plan'],
                        },
                        priority: {
                          type: Type.STRING,
                          enum: ['high', 'medium', 'low'],
                        },
                        tips: { type: Type.STRING },
                        decisionTrace: decisionTraceSchema,
                      },
                      required: [
                        'id',
                        'title',
                        'description',
                        'estimatedMinutes',
                        'type',
                        'priority',
                      ],
                    },
                  },
                },
                required: ['id', 'title', 'description', 'order', 'tasks'],
              },
            },
          },
          required: [
            'planningMode',
            'goalInsight',
            'diagnosedBottleneck',
            'diagnosticConfidence',
            'summary',
            'goal',
            'estimatedDuration',
            'successDefinition',
            'firstAction',
            'firstActionTrace',
            'milestones',
          ],
        },
      },
    });

    let roadmapData: any = null;
    try {
      roadmapData = extractJsonFromText(response.text || '{}');
    } catch (parseError: any) {
      console.error('Failed to parse roadmap JSON:', parseError, 'Raw text:', (response.text || '').slice(0, 200));
      return res.status(502).json({
        error: 'The AI service returned an incomplete response. Please click Try Again.',
        code: 'MALFORMED_RESPONSE',
      });
    }

    if (!roadmapData || typeof roadmapData !== 'object' || !Array.isArray(roadmapData.milestones) || roadmapData.milestones.length === 0) {
      return res.status(502).json({
        error: 'The generated plan was missing required milestones. Please click Try Again.',
        code: 'INCOMPLETE_MILESTONES',
      });
    }

    // Add unique IDs and initialize completion states if missing
    const enrichedRoadmap = {
      ...roadmapData,
      planningMode: roadmapData.planningMode || certaintyMode,
      diagnosedBottleneck: roadmapData.diagnosedBottleneck || 'Initial diagnostic required to isolate bottleneck',
      diagnosticConfidence: roadmapData.diagnosticConfidence || 'provisional',
      desiredVsFeasibleOutcome: roadmapData.desiredVsFeasibleOutcome || undefined,
      firstActionTrace: roadmapData.firstActionTrace || undefined,
      resources: Array.isArray(profile.resources) ? profile.resources : [],
      groundingNotes: profile.groundingNotes || undefined,
      risks: Array.isArray(roadmapData.risks) ? roadmapData.risks : [],
      id: `roadmap-${Date.now()}`,
      createdAt: new Date().toISOString(),
      milestones: (roadmapData.milestones || []).map((m: any, mIdx: number) => ({
        ...m,
        id: m.id || `m-${mIdx + 1}`,
        order: m.order || mIdx + 1,
        tasks: (m.tasks || []).map((t: any, tIdx: number) => {
          const taskTrace = t.decisionTrace || (mIdx === 0 && tIdx === 0 ? roadmapData.firstActionTrace : undefined);
          return {
            ...t,
            id: t.id || `t-${mIdx + 1}-${tIdx + 1}`,
            completed: false,
            estimatedMinutes: Number(t.estimatedMinutes) || 30,
            decisionTrace: taskTrace,
          };
        }),
      })),
    };

    return res.json(enrichedRoadmap);
  } catch (error: any) {
    console.error('Error in /api/generate-roadmap:', error);
    const { status, message, code } = classifyError(error);
    return res.status(status).json({
      error: message,
      code,
      details: error.message,
    });
  }
});

// 3. Adapt Roadmap Endpoint
app.post('/api/adapt-roadmap', async (req: Request, res: Response) => {
  try {
    const {
      profile,
      currentRoadmap,
      feedbackCategory,
      feedbackNotes,
      specificTaskId,
    } = req.body;

    if (!currentRoadmap || !feedbackCategory) {
      return res.status(400).json({ error: 'Missing current roadmap or feedback' });
    }

    // Separate completed and remaining tasks
    const completedTasks: any[] = [];
    const remainingTasks: any[] = [];
    let targetTaskDetails: any = null;

    (currentRoadmap.milestones || []).forEach((m: any) => {
      (m.tasks || []).forEach((t: any) => {
        if (t.completed) {
          completedTasks.push({ milestoneTitle: m.title, ...t });
        } else {
          remainingTasks.push({ milestoneTitle: m.title, ...t });
        }

        if (specificTaskId && t.id === specificTaskId) {
          targetTaskDetails = { milestoneTitle: m.title, ...t };
        }
      });
    });

    const completedTasksJson = JSON.stringify(
      completedTasks.map((t) => ({ id: t.id, title: t.title, type: t.type }))
    );
    const remainingTasksJson = JSON.stringify(
      remainingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
        type: t.type,
        decisionTrace: t.decisionTrace,
      }))
    );

    const goalText = currentRoadmap.goal;
    const motivationText = profile?.motivation || 'Not specified';
    const certaintyText = profile?.certainty || 'Not specified';
    const eduText = profile?.educationLevel || 'Not specified';
    const timeText = profile?.timePerDay || 'Not specified';
    const constraintsText = Array.isArray(profile?.constraints) ? profile.constraints.join(', ') : 'None';
    const feedbackNotesText = feedbackNotes || 'No additional note';
    const specificTaskText = specificTaskId || 'General roadmap';

    const prompt = `
A student in Nepal is working through their personalized roadmap and provided feedback or encountered an obstacle.
Adapt their remaining plan dynamically according to flexible planning principles without losing their completed work!

Student Profile:
- Goal: "${goalText}"
- Motivation: "${motivationText}"
- Certainty: "${certaintyText}"
- Education Level: ${eduText}
- Daily Study Time: ${timeText}
- Constraints: ${constraintsText}

Current Bottleneck Diagnosis:
- Diagnosed Bottleneck: "${currentRoadmap.diagnosedBottleneck || 'Initial assessment'}"
- Diagnostic Confidence: "${currentRoadmap.diagnosticConfidence || 'provisional'}"
${currentRoadmap.desiredVsFeasibleOutcome ? `- Reality Calibration: "${currentRoadmap.desiredVsFeasibleOutcome}"` : ''}

Student Feedback / Observed Result:
- Feedback Reason / Category: "${feedbackCategory}"
- Student Note / Context: "${feedbackNotesText}"
- Specific Task Encountered: "${specificTaskText}"
${targetTaskDetails ? `- Task Details & Decision Trace: ${JSON.stringify(targetTaskDetails)}` : ''}

Completed Tasks (${completedTasks.length} done - PRESERVE THESE COMPLETED TASKS INTACT):
${completedTasksJson}

Remaining Tasks (${remainingTasks.length} pending):
${remainingTasksJson}

ADAPTATION & BRANCHING PRINCIPLES:
1. EXECUTE THE BRANCHING DECISION:
   The feedback category ("${feedbackCategory}") and student note represent the OBSERVED RESULT of their attempt.
   - If "I failed the diagnostic / got stuck on the check" or "This was too difficult" / "I got stuck":
     Execute the repair branch! Do NOT continue forward. Deconstruct the blocker into smaller prerequisite steps, repair the missing mental model or syntax confusion, and provide a low-friction diagnostic entry point.
   - If "I already know this / too easy":
     Execute the acceleration branch! Eliminate introductory steps and immediately advance to higher-leverage problem solving, project building, or advanced exam questions.
   - If "I tried it and disliked it":
     Treat this as valuable evidence of preference. Pivot the remaining exploration milestones or offer a different angle without treating it as failure.
   - If "I had less time than expected":
     Triage aggressively. Compress pending tasks into 15-20 min high-impact actions and adjust estimatedDuration realistically.
   - If "My goal changed":
     Pivot remaining milestones toward the new direction while honoring completed work.

2. UPDATE DIAGNOSTIC BOTTLENECK & CONFIDENCE:
   - Update "diagnosedBottleneck" to reflect what this new feedback proved about their true obstacle.
   - Update "diagnosticConfidence" ('high', 'provisional', or 'insufficient_evidence').

3. PRESERVE COMPLETED WORK:
   - Any tasks already completed must remain completed and respected.

4. REFRESH IMMEDIATE ACTION ("firstAction" & "firstActionTrace"):
   - Provide a concrete 10-25 minute unblocking step they can do TODAY to regain momentum, with an updated "firstActionTrace" defining purpose, evidence, and branching rules.

5. PROVIDE AN HONEST ADAPTATION NOTE:
   - Provide a calm, honest "adaptationNote" explaining what was adjusted and why it matches their updated reality.
`;

    const response = await generateContentWithRetry({
      preferredModel: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: PLANNING_ENGINE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planningMode: {
              type: Type.STRING,
              enum: ['committed', 'exploring', 'uncertain'],
            },
            goalInsight: { type: Type.STRING },
            diagnosedBottleneck: { type: Type.STRING },
            diagnosticConfidence: {
              type: Type.STRING,
              enum: ['high', 'provisional', 'insufficient_evidence'],
            },
            desiredVsFeasibleOutcome: { type: Type.STRING },
            adaptationNote: { type: Type.STRING },
            firstAction: { type: Type.STRING },
            firstActionTrace: decisionTraceSchema,
            estimatedDuration: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  order: { type: Type.INTEGER },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        estimatedMinutes: { type: Type.INTEGER },
                        type: {
                          type: Type.STRING,
                          enum: ['read', 'practice', 'build', 'review', 'exercise', 'plan'],
                        },
                        priority: {
                          type: Type.STRING,
                          enum: ['high', 'medium', 'low'],
                        },
                        tips: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN },
                        decisionTrace: decisionTraceSchema,
                      },
                      required: ['id', 'title', 'description', 'estimatedMinutes', 'type', 'priority'],
                    },
                  },
                },
                required: ['id', 'title', 'description', 'order', 'tasks'],
              },
            },
          },
          required: [
            'adaptationNote',
            'firstAction',
            'diagnosedBottleneck',
            'diagnosticConfidence',
            'milestones',
          ],
        },
      },
    });

    let adaptedData: any = null;
    try {
      adaptedData = extractJsonFromText(response.text || '{}');
    } catch (parseError: any) {
      console.error('Failed to parse adapted roadmap JSON:', parseError);
      return res.status(502).json({
        error: 'The AI service returned an incomplete adaptation. Please try again.',
        code: 'MALFORMED_RESPONSE',
      });
    }

    if (!adaptedData || typeof adaptedData !== 'object' || !Array.isArray(adaptedData.milestones)) {
      return res.status(502).json({
        error: 'The adaptation was missing required milestones. Please try again.',
        code: 'INCOMPLETE_MILESTONES',
      });
    }

    // Ensure completed task status from original roadmap is preserved
    const completedIdSet = new Set(completedTasks.map((t) => t.id));

    // Map adapted milestones
    const adaptedMilestones = (adaptedData.milestones || []).map((m: any, mIdx: number) => ({
      ...m,
      id: m.id || `m-adapted-${mIdx + 1}`,
      order: m.order || mIdx + 1,
      tasks: (m.tasks || []).map((t: any, tIdx: number) => ({
        ...t,
        id: t.id || `t-adapted-${mIdx + 1}-${tIdx + 1}`,
        // Preserve completed state if it was previously completed
        completed: completedIdSet.has(t.id) || !!t.completed,
        estimatedMinutes: Number(t.estimatedMinutes) || 30,
        decisionTrace: t.decisionTrace || (mIdx === 0 && tIdx === 0 ? adaptedData.firstActionTrace : undefined),
      })),
    }));

    // If any completed tasks were omitted by the model, prepend them in a preserved milestone
    const presentCompletedTitles = new Set(
      adaptedMilestones.flatMap((m: any) => (m.tasks || []).filter((t: any) => t.completed).map((t: any) => t.title?.toLowerCase()))
    );
    const missingCompletedTasks = completedTasks.filter(
      (ct) => !presentCompletedTitles.has(ct.title?.toLowerCase())
    );

    let finalMilestones = adaptedMilestones;
    if (missingCompletedTasks.length > 0) {
      const preservedMilestone = {
        id: 'm-completed-preserved',
        title: 'Completed Work',
        description: 'Previously completed diagnostic and foundation tasks',
        order: 0,
        tasks: missingCompletedTasks.map((ct) => ({
          ...ct,
          completed: true,
        })),
      };
      finalMilestones = [preservedMilestone, ...adaptedMilestones];
    }

    const updatedRoadmap = {
      ...currentRoadmap,
      planningMode: adaptedData.planningMode || currentRoadmap.planningMode,
      goalInsight: adaptedData.goalInsight || currentRoadmap.goalInsight,
      diagnosedBottleneck: adaptedData.diagnosedBottleneck || currentRoadmap.diagnosedBottleneck,
      diagnosticConfidence: adaptedData.diagnosticConfidence || currentRoadmap.diagnosticConfidence,
      desiredVsFeasibleOutcome: adaptedData.desiredVsFeasibleOutcome || currentRoadmap.desiredVsFeasibleOutcome,
      lastAdaptedAt: new Date().toISOString(),
      adaptationNote: adaptedData.adaptationNote,
      firstAction: adaptedData.firstAction || currentRoadmap.firstAction,
      firstActionTrace: adaptedData.firstActionTrace || currentRoadmap.firstActionTrace,
      estimatedDuration: adaptedData.estimatedDuration || currentRoadmap.estimatedDuration,
      resources: currentRoadmap.resources || (profile?.resources ? profile.resources : []),
      groundingNotes: currentRoadmap.groundingNotes || profile?.groundingNotes,
      milestones: finalMilestones,
    };

    return res.json(updatedRoadmap);
  } catch (error: any) {
    console.error('Error in /api/adapt-roadmap:', error);
    const { status, message, code } = classifyError(error);
    return res.status(status).json({
      error: message,
      code,
      details: error.message,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
