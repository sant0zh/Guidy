import {
  ClarificationQuestion,
  FeedbackCategory,
  GuidanceChatResponse,
  Roadmap,
  StudentProfile,
  UserResource,
} from '../types/navigator';

export interface ClarificationResponse {
  needsClarification: boolean;
  reason?: string;
  questions?: ClarificationQuestion[];
}

// Timeout helper that works in all browsers
function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

export async function sendGuidanceChatMessage(params: {
  messages: Array<{ sender: 'user' | 'agent'; text: string }>;
  currentProfile?: Partial<StudentProfile> | null;
  currentRoadmap?: Roadmap | null;
  resources?: UserResource[];
}): Promise<GuidanceChatResponse> {
  const { signal, cleanup } = createTimeoutSignal(22000); // 22s bounded timeout

  try {
    const response = await fetch('/api/guidance-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    });

    cleanup();

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {}

      if (response.status === 429) {
        throw new Error(
          errorData.error || 'The AI service is experiencing high demand. Please try again in a moment.'
        );
      }
      throw new Error(errorData.error || 'Failed to get guidance response. Please try again.');
    }

    return await response.json();
  } catch (err: any) {
    cleanup();
    if (err.name === 'AbortError' || err.message?.includes('timed out')) {
      throw new Error('Guidance conversation timed out. Please try again.');
    }
    throw err;
  }
}

export async function checkGoalClarification(
  goalCategory: string,
  goalDescription: string,
  educationLevel: string,
  field: string,
  motivation?: string,
  certainty?: string
): Promise<ClarificationResponse> {
  const { signal, cleanup } = createTimeoutSignal(8000); // 8s non-blocking timeout

  try {
    const response = await fetch('/api/clarify-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalCategory,
        goalDescription,
        educationLevel,
        field,
        motivation,
        certainty,
      }),
      signal,
    });

    cleanup();

    if (!response.ok) {
      return { needsClarification: false, questions: [] };
    }

    return await response.json();
  } catch (e) {
    cleanup();
    // Non-blocking fallback on timeout or error
    return { needsClarification: false, questions: [] };
  }
}

export async function generateRoadmap(
  profile: StudentProfile,
  clarificationAnswers?: Record<string, string>
): Promise<Roadmap> {
  const maxAttempts = 2; // Bounded: 1 initial attempt + at most 1 retry for transient network hiccups
  let lastErrorMessage = 'Failed to generate learning plan. Please try again.';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { signal, cleanup } = createTimeoutSignal(22000); // 22s bounded client timeout

    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          clarificationAnswers,
        }),
        signal,
      });

      cleanup();

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Response body was not JSON (e.g. gateway HTML 502/504)
        }

        const status = response.status;

        // Specific HTTP status handling
        if (status === 429 || errorData.code === 'RATE_LIMITED') {
          throw new Error(
            errorData.error ||
              'The AI service is temporarily busy due to high demand. Your goal and profile details are saved—please click Try Again in a moment.'
          );
        }

        if (status === 504 || errorData.code === 'TIMEOUT') {
          lastErrorMessage =
            errorData.error ||
            'Generating your plan took longer than expected. Please click Try Again.';
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error(lastErrorMessage);
        }

        if (status === 503 || errorData.code === 'SERVICE_BUSY') {
          lastErrorMessage =
            errorData.error ||
            'The AI service is temporarily busy. Your goal and profile details are saved—please click Try Again in a few moments.';
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error(lastErrorMessage);
        }

        if (status === 502 || errorData.code === 'MALFORMED_RESPONSE' || errorData.code === 'INCOMPLETE_MILESTONES') {
          lastErrorMessage =
            errorData.error ||
            'The AI service returned an incomplete response. Please click Try Again.';
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
          throw new Error(lastErrorMessage);
        }

        throw new Error(
          errorData.error || `Unable to generate plan (Error ${status}). Please try again.`
        );
      }

      let roadmap: Roadmap;
      try {
        roadmap = await response.json();
      } catch (jsonErr) {
        throw new Error('Received an unreadable response from the server. Please click Try Again.');
      }

      // Strict validation of returned roadmap
      if (!roadmap || !roadmap.milestones || !Array.isArray(roadmap.milestones) || roadmap.milestones.length === 0) {
        throw new Error('The plan returned from the server was incomplete. Please click Try Again.');
      }

      return roadmap;
    } catch (err: any) {
      cleanup();

      if (err.name === 'AbortError' || err.message?.includes('timed out')) {
        lastErrorMessage =
          'Planning request took longer than expected to respond. Please click Try Again.';
      } else if (err.message) {
        lastErrorMessage = err.message;
      }

      // Do NOT auto-retry 429 rate limit errors or user-explicit errors
      if (
        lastErrorMessage.includes('busy due to high demand') ||
        lastErrorMessage.includes('rate limit')
      ) {
        throw new Error(lastErrorMessage);
      }

      if (attempt >= maxAttempts) {
        throw new Error(lastErrorMessage);
      }

      // Wait briefly before bounded retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(lastErrorMessage);
}

export async function adaptRoadmap(
  profile: StudentProfile | null,
  currentRoadmap: Roadmap,
  feedbackCategory: FeedbackCategory,
  feedbackNotes?: string,
  specificTaskId?: string
): Promise<Roadmap> {
  const { signal, cleanup } = createTimeoutSignal(18000); // 18s bounded timeout

  try {
    const response = await fetch('/api/adapt-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        currentRoadmap,
        feedbackCategory,
        feedbackNotes,
        specificTaskId,
      }),
      signal,
    });

    cleanup();

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {}

      if (response.status === 429) {
        throw new Error(
          errorData.error ||
            'The AI service is temporarily busy. Please wait a moment and try adapting again.'
        );
      }

      if (response.status === 504 || response.status === 503) {
        throw new Error(
          errorData.error ||
            'Adapting your roadmap took longer than expected. Please try again.'
        );
      }

      throw new Error(errorData.error || 'Failed to adapt roadmap. Please try again.');
    }

    const adapted: Roadmap = await response.json();
    if (!adapted || !adapted.milestones || !Array.isArray(adapted.milestones) || adapted.milestones.length === 0) {
      throw new Error('Received an incomplete adapted roadmap format from server.');
    }

    return adapted;
  } catch (err: any) {
    cleanup();
    if (err.name === 'AbortError' || err.message?.includes('timed out')) {
      throw new Error('Adapting your roadmap timed out. Please try again.');
    }
    throw err;
  }
}
