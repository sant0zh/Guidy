import {
  AppScreen,
  ChatMessage,
  ContextSufficiency,
  FeedbackEntry,
  Roadmap,
  StudentProfile,
  UserResource,
} from '../types/navigator';

export interface AppStateData {
  currentScreen: AppScreen;
  profile: StudentProfile | null;
  roadmap: Roadmap | null;
  feedbackHistory: FeedbackEntry[];
  messages?: ChatMessage[];
  resources?: UserResource[];
  contextSufficiency?: ContextSufficiency;
  lastUpdated: string;
}

const STORAGE_KEY = 'oln_nepal_state_v02';
const LEGACY_STORAGE_KEY = 'oln_nepal_state_v01';

export const loadStoredState = (): AppStateData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
    return null;
  }
};

export const saveStateToStorage = (data: AppStateData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
};

export const clearStoredState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear state from localStorage:', e);
  }
};
