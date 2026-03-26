import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

// Muscle Categories with RPG themes
export const MUSCLE_CATEGORIES = {
  push: {
    name: 'Push',
    role: 'Warrior Strength',
    color: '#ff6b6b',
    icon: '⚔️',
    exercises: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Push Press']
  },
  pull: {
    name: 'Pull',
    role: 'Agility/Dexterity',
    color: '#4ecdc4',
    icon: '🏹',
    exercises: ['Face Pulls', 'Bicep Curls', 'Hammer Curls', 'Cable Curls']
  },
  chest: {
    name: 'Chest',
    role: 'Armor/Tankiness',
    color: '#95e1d3',
    icon: '🛡️',
    exercises: ['Bench Press', 'Chest Fly', 'Incline Press', 'Dips']
  },
  back: {
    name: 'Back',
    role: 'The Titan Back',
    color: '#f38181',
    icon: '🗿',
    exercises: ['Lat Pulldown', 'Deadlift', 'Barbell Row', 'T-Bar Row']
  },
  legs: {
    name: 'Legs',
    role: 'Stamina/Foundation',
    color: '#aa96da',
    icon: '⚡',
    exercises: ['Squat', 'Leg Press', 'Leg Extension', 'Leg Curl']
  }
};

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  exp: number;
}

export interface WorkoutSession {
  id: string;
  category: keyof typeof MUSCLE_CATEGORIES;
  exercise: string;
  exerciseId?: string; // ExerciseDB ID
  sets: WorkoutSet[];
  date: string;
  totalExp: number;
}

export interface CategoryStats {
  category: keyof typeof MUSCLE_CATEGORIES;
  exp: number;
  level: number;
  expToNextLevel: number;
  progress: number;
  rating: number; // 0-999 rating points
}

interface WorkoutContextType {
  stats: Record<keyof typeof MUSCLE_CATEGORIES, CategoryStats>;
  sessions: WorkoutSession[];
  currentSession: WorkoutSession | null;
  totalLevel: number;
  totalExp: number;
  currentDay: number;
  streak: number;
  startWorkout: (category: keyof typeof MUSCLE_CATEGORIES, exercise: string, exerciseId?: string) => void;
  addSet: (weight: number, reps: number) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// EXP calculation: Weight × Reps
const calculateExp = (weight: number, reps: number): number => {
  return Math.floor(weight * reps);
};

// Level calculation: Every 1000 EXP = 1 level
const calculateLevel = (exp: number): number => {
  return Math.floor(exp / 1000);
};

const expToNextLevel = (currentExp: number): number => {
  const currentLevel = calculateLevel(currentExp);
  return (currentLevel + 1) * 1000 - currentExp;
};

const levelProgress = (currentExp: number): number => {
  const level = calculateLevel(currentExp);
  const expForThisLevel = level * 1000;
  const expInCurrentLevel = currentExp - expForThisLevel;
  return (expInCurrentLevel / 1000) * 100;
};

const buildDefaultStats = (): Record<keyof typeof MUSCLE_CATEGORIES, CategoryStats> => {
  return Object.keys(MUSCLE_CATEGORIES).reduce((acc, key) => {
    const cat = key as keyof typeof MUSCLE_CATEGORIES;
    acc[cat] = {
      category: cat,
      exp: 0,
      level: 0,
      expToNextLevel: 1000,
      progress: 0,
      rating: 0
    };
    return acc;
  }, {} as Record<keyof typeof MUSCLE_CATEGORIES, CategoryStats>);
};

const normalizeSavedStats = (saved: unknown): Record<keyof typeof MUSCLE_CATEGORIES, CategoryStats> => {
  const defaults = buildDefaultStats();

  if (!saved || typeof saved !== 'object') {
    return defaults;
  }

  const parsed = saved as Partial<Record<keyof typeof MUSCLE_CATEGORIES, Partial<CategoryStats>>>;

  for (const key of Object.keys(defaults) as Array<keyof typeof MUSCLE_CATEGORIES>) {
    const source = parsed[key];
    const exp = typeof source?.exp === 'number' ? Math.max(0, source.exp) : 0;
    const rating = typeof source?.rating === 'number' ? Math.max(0, Math.min(999, source.rating)) : 0;

    defaults[key] = {
      category: key,
      exp,
      level: calculateLevel(exp),
      expToNextLevel: expToNextLevel(exp),
      progress: levelProgress(exp),
      rating,
    };
  }

  return defaults;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userLevel, setUserLevel } = useAuth();
  const [stats, setStats] = useState<Record<keyof typeof MUSCLE_CATEGORIES, CategoryStats>>(() => {
    const saved = localStorage.getItem('ironquest-stats');
    if (saved) {
      try {
        return normalizeSavedStats(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved stats, using defaults:', error);
      }
    }

    return buildDefaultStats();
  });

  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    const saved = localStorage.getItem('ironquest-sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('ironquest-streak');
    return saved ? parseInt(saved) : 0;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('ironquest-stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('ironquest-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('ironquest-streak', streak.toString());
  }, [streak]);

  const totalLevel = Object.values(stats).reduce((sum, stat) => sum + stat.level, 0);
  const totalExp = Object.values(stats).reduce((sum, stat) => sum + stat.exp, 0);
  const currentDay = new Date().getDay();

  useEffect(() => {
    if (!user) {
      return;
    }

    const computedLevel = calculateLevel(totalExp);
    if (computedLevel === userLevel) {
      return;
    }

    setUserLevel(computedLevel).catch((error) => {
      console.error('Failed to sync user level:', error);
    });
  }, [user?.id, totalExp, userLevel]);

  const startWorkout = (category: keyof typeof MUSCLE_CATEGORIES, exercise: string, exerciseId?: string) => {
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      category,
      exercise,
      exerciseId,
      sets: [],
      date: new Date().toISOString(),
      totalExp: 0
    };
    setCurrentSession(newSession);
  };

  const addSet = (weight: number, reps: number) => {
    if (!currentSession) return;

    const exp = calculateExp(weight, reps);
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      weight,
      reps,
      exp
    };

    setCurrentSession({
      ...currentSession,
      sets: [...currentSession.sets, newSet],
      totalExp: currentSession.totalExp + exp
    });
  };

  const finishWorkout = () => {
    if (!currentSession) return;

    const completedSession = currentSession;

    // Update stats
    const category = completedSession.category;
    const newExp = stats[category].exp + completedSession.totalExp;
    
    setStats(prev => ({
      ...prev,
      [category]: {
        category,
        exp: newExp,
        level: calculateLevel(newExp),
        expToNextLevel: expToNextLevel(newExp),
        progress: levelProgress(newExp),
        rating: Math.min(999, stats[category].rating + 10) // Increase rating by 10 points
      }
    }));

    // Save session
    setSessions(prev => [completedSession, ...prev]);

    if (user) {
      supabase
        .from('training_logs')
        .upsert(
          {
            user_id: user.id,
            session_id: completedSession.id,
            category: completedSession.category,
            exercise: completedSession.exercise,
            exercise_id: completedSession.exerciseId || null,
            workout_date: completedSession.date,
            total_exp: completedSession.totalExp,
            total_sets: completedSession.sets.length,
            sets_json: completedSession.sets,
          },
          { onConflict: 'user_id,session_id' }
        )
        .then(({ error }) => {
          if (error) {
            console.error('Failed to save training log:', error);
          }
        });
    }

    // Update streak
    const today = new Date().toDateString();
    const lastWorkout = sessions[0]?.date ? new Date(sessions[0].date).toDateString() : null;
    if (lastWorkout !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastWorkout === yesterday) {
        setStreak(prev => prev + 1);
      } else if (lastWorkout !== today) {
        setStreak(1);
      }
    }

    setCurrentSession(null);
  };

  const cancelWorkout = () => {
    setCurrentSession(null);
  };

  return (
    <WorkoutContext.Provider
      value={{
        stats,
        sessions,
        currentSession,
        totalLevel,
        totalExp,
        currentDay,
        streak,
        startWorkout,
        addSet,
        finishWorkout,
        cancelWorkout
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
};