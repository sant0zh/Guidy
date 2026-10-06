import React, { useState, useEffect } from 'react';
import {
  AppScreen,
  ClarificationQuestion,
  FeedbackCategory,
  FeedbackEntry,
  GoalCategory,
  Roadmap,
  StudentProfile,
  Task,
} from './types/navigator';
import {
  clearStoredState,
  loadStoredState,
  saveStateToStorage,
} from './utils/storage';
import {
  adaptRoadmap,
  checkGoalClarification,
  generateRoadmap,
} from './utils/api';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GoalSelectionScreen } from './components/GoalSelectionScreen';
import { StudentProfileScreen } from './components/StudentProfileScreen';
import { ClarificationScreen } from './components/ClarificationScreen';
import { PlanningScreen } from './components/PlanningScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { AdaptModal } from './components/AdaptModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('skill');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([]);

  // Clarification state
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  // Loading & Error states
  const [planningError, setPlanningError] = useState<string | null>(null);

  // Adapt Modal state
  const [isAdaptModalOpen, setIsAdaptModalOpen] = useState(false);
  const [targetStuckTask, setTargetStuckTask] = useState<Task | null>(null);

  // 1. Initial Load from localStorage
  useEffect(() => {
    const saved = loadStoredState();
    if (saved) {
      if (saved.roadmap) {
        setRoadmap(saved.roadmap);
        setProfile(saved.profile);
        setFeedbackHistory(saved.feedbackHistory || []);
        setCurrentScreen(saved.currentScreen || 'dashboard');
        if (saved.profile?.goalCategory) {
          setSelectedCategory(saved.profile.goalCategory);
        }
      } else if (saved.profile) {
        setProfile(saved.profile);
        setSelectedCategory(saved.profile.goalCategory);
        setCurrentScreen(saved.currentScreen || 'profile');
      } else if (saved.currentScreen === 'goal') {
        setCurrentScreen('goal');
      }
    }
  }, []);

  // 2. Persist state to localStorage on changes
  useEffect(() => {
    saveStateToStorage({
      currentScreen,
      profile,
      roadmap,
      feedbackHistory,
      lastUpdated: new Date().toISOString(),
    });
  }, [currentScreen, profile, roadmap, feedbackHistory]);

  // Screen transitions
  const handleStart = () => {
    setCurrentScreen('goal');
  };

  const handleResume = () => {
    if (roadmap) {
      setCurrentScreen('dashboard');
    }
  };

  const handleSelectGoalCategory = (category: GoalCategory) => {
    setSelectedCategory(category);
    setCurrentScreen('profile');
  };

  // Called when student finishes filling profile
  const handleProfileSubmit = async (newProfile: StudentProfile) => {
    setProfile(newProfile);

    // Check if goal is broad and needs 1-2 clarification questions
    try {
      const clarifyResult = await checkGoalClarification(
        newProfile.goalCategory,
        newProfile.goalDescription,
        newProfile.educationLevel,
        newProfile.field,
        newProfile.motivation,
        newProfile.certainty
      );

      if (
        clarifyResult.needsClarification &&
        clarifyResult.questions &&
        clarifyResult.questions.length > 0
      ) {
        setClarificationQuestions(clarifyResult.questions);
        setCurrentScreen('clarification');
        return;
      }
    } catch (e) {
      console.warn('Clarification check failed, skipping to planning:', e);
    }

    // Otherwise proceed directly to planning
    startPlanning(newProfile, {});
  };

  // Called from clarification screen
  const handleClarificationConfirm = (answers: Record<string, string>) => {
    setClarificationAnswers(answers);
    if (profile) {
      startPlanning(profile, answers);
    }
  };

  const handleClarificationSkip = () => {
    if (profile) {
      startPlanning(profile, {});
    }
  };

  // Start plan generation with Gemini
  const startPlanning = async (
    targetProfile: StudentProfile,
    answers: Record<string, string>
  ) => {
    setCurrentScreen('planning');
    setPlanningError(null);

    try {
      const generated = await generateRoadmap(targetProfile, answers);
      setRoadmap(generated);
      setCurrentScreen('dashboard');
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setPlanningError(err.message || 'Unable to generate plan. Please try again.');
    }
  };

  const handleRetryPlanning = () => {
    if (profile) {
      startPlanning(profile, clarificationAnswers);
    }
  };

  // Toggle task completion
  const handleToggleTaskComplete = (taskId: string) => {
    if (!roadmap) return;

    const updatedMilestones = roadmap.milestones.map((m) => ({
      ...m,
      tasks: m.tasks.map((t) => {
        if (t.id === taskId) {
          const isDone = !t.completed;
          return {
            ...t,
            completed: isDone,
            completedAt: isDone ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    }));

    setRoadmap({
      ...roadmap,
      milestones: updatedMilestones,
    });
  };

  // Open "I'm stuck" modal
  const handleOpenAdaptModal = (task?: Task | null) => {
    setTargetStuckTask(task || null);
    setIsAdaptModalOpen(true);
  };

  // Submit adaptation request
  const handleSubmitAdaptation = async (
    category: FeedbackCategory,
    notes: string,
    specificTaskId?: string
  ) => {
    if (!roadmap) return;

    const adapted = await adaptRoadmap(
      profile,
      roadmap,
      category,
      notes,
      specificTaskId
    );

    const newFeedbackEntry: FeedbackEntry = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      notes,
      specificTaskId,
      adaptationSummary: adapted.adaptationNote,
    };

    setFeedbackHistory((prev) => [newFeedbackEntry, ...prev]);
    setRoadmap(adapted);
  };

  // Start fresh / reset with a new goal
  const handleReset = () => {
    clearStoredState();
    setRoadmap(null);
    setProfile(null);
    setSelectedCategory('skill');
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setPlanningError(null);
    setFeedbackHistory([]);
    setCurrentScreen('goal');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <Header
        currentScreen={currentScreen}
        onReset={handleReset}
        hasActivePlan={!!roadmap}
      />

      <main className="flex-1">
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onStart={handleStart}
            existingRoadmap={roadmap}
            onResume={handleResume}
          />
        )}

        {currentScreen === 'goal' && (
          <GoalSelectionScreen
            initialCategory={selectedCategory}
            onSelectGoal={handleSelectGoalCategory}
            onBack={() => setCurrentScreen('welcome')}
          />
        )}

        {currentScreen === 'profile' && (
          <StudentProfileScreen
            goalCategory={selectedCategory}
            initialProfile={profile}
            onSubmit={handleProfileSubmit}
            onBack={() => setCurrentScreen('goal')}
          />
        )}

        {currentScreen === 'clarification' && profile && (
          <ClarificationScreen
            profile={profile}
            questions={clarificationQuestions}
            onConfirm={handleClarificationConfirm}
            onSkip={handleClarificationSkip}
          />
        )}

        {currentScreen === 'planning' && (
          <PlanningScreen
            error={planningError}
            onRetry={handleRetryPlanning}
            onBackToProfile={() => setCurrentScreen('profile')}
            hasExistingRoadmap={!!roadmap}
            onViewExistingRoadmap={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'dashboard' && roadmap && (
          <DashboardScreen
            roadmap={roadmap}
            profile={profile}
            onToggleTaskComplete={handleToggleTaskComplete}
            onOpenAdaptModal={handleOpenAdaptModal}
            onStartNewPlan={handleReset}
          />
        )}
      </main>

      <AdaptModal
        isOpen={isAdaptModalOpen}
        onClose={() => setIsAdaptModalOpen(false)}
        targetTask={targetStuckTask}
        onSubmitAdaptation={handleSubmitAdaptation}
      />
    </div>
  );
}
