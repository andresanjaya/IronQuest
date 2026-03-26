import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { Exercise } from '../services/exerciseApi';

export interface FavoriteExercise {
  id: string;
  user_id: string;
  exercise_id: string;
  name: string;
  gif_url: string;
  target: string;
  body_part: string;
  equipment: string;
  created_at: string;
}

export interface ProgramExercise {
  id: string;
  exercise_id: string;
  name: string;
  gif_url: string;
  target: string;
  body_part: string;
  equipment: string;
  sort_order: number;
}

export interface WorkoutProgram {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  exercises: ProgramExercise[];
}

interface UserDataContextType {
  favorites: FavoriteExercise[];
  programs: WorkoutProgram[];
  loading: boolean;
  isFavorite: (exerciseId: string) => boolean;
  toggleFavorite: (exercise: Exercise) => Promise<void>;
  createProgram: (name: string, description: string, exercises: Exercise[]) => Promise<{ error: string | null }>;
  deleteProgram: (programId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

type ProgramRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  program_exercises: ProgramExercise[] | null;
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteExercise[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const { data, error } = await supabase
      .from('favorite_exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load favorites:', error);
      setFavorites([]);
      return;
    }

    setFavorites((data || []) as FavoriteExercise[]);
  };

  const loadPrograms = async () => {
    if (!user) {
      setPrograms([]);
      return;
    }

    const { data, error } = await supabase
      .from('workout_programs')
      .select('id,user_id,name,description,created_at,program_exercises(id,exercise_id,name,gif_url,target,body_part,equipment,sort_order)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load programs:', error);
      setPrograms([]);
      return;
    }

    const mapped = ((data || []) as ProgramRow[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description || '',
      created_at: row.created_at,
      exercises: (row.program_exercises || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    setPrograms(mapped);
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadFavorites(), loadPrograms()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [user?.id]);

  const value = useMemo<UserDataContextType>(
    () => ({
      favorites,
      programs,
      loading,
      isFavorite: (exerciseId: string) => favorites.some((f) => f.exercise_id === exerciseId),
      toggleFavorite: async (exercise: Exercise) => {
        if (!user) {
          return;
        }

        const existing = favorites.find((f) => f.exercise_id === exercise.id);

        if (existing) {
          const { error } = await supabase.from('favorite_exercises').delete().eq('id', existing.id);
          if (error) {
            console.error('Failed to remove favorite:', error);
            return;
          }
          setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
          return;
        }

        const payload = {
          user_id: user.id,
          exercise_id: exercise.id,
          name: exercise.name,
          gif_url: exercise.gifUrl,
          target: exercise.target,
          body_part: exercise.bodyPart,
          equipment: exercise.equipment,
        };

        const { data, error } = await supabase
          .from('favorite_exercises')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.error('Failed to add favorite:', error);
          return;
        }

        setFavorites((prev) => [data as FavoriteExercise, ...prev]);
      },
      createProgram: async (name: string, description: string, exercises: Exercise[]) => {
        if (!user) {
          return { error: 'You must be logged in.' };
        }

        if (!name.trim()) {
          return { error: 'Program name is required.' };
        }

        if (exercises.length === 0) {
          return { error: 'Add at least one exercise.' };
        }

        const { data: program, error: programError } = await supabase
          .from('workout_programs')
          .insert({
            user_id: user.id,
            name: name.trim(),
            description: description.trim(),
          })
          .select('id,user_id,name,description,created_at')
          .single();

        if (programError || !program) {
          return { error: programError?.message || 'Failed to create program.' };
        }

        const rows = exercises.map((exercise, index) => ({
          program_id: program.id,
          exercise_id: exercise.id,
          name: exercise.name,
          gif_url: exercise.gifUrl,
          target: exercise.target,
          body_part: exercise.bodyPart,
          equipment: exercise.equipment,
          sort_order: index,
        }));

        const { data: insertedExercises, error: exerciseError } = await supabase
          .from('program_exercises')
          .insert(rows)
          .select('id,exercise_id,name,gif_url,target,body_part,equipment,sort_order');

        if (exerciseError) {
          await supabase.from('workout_programs').delete().eq('id', program.id);
          return { error: exerciseError.message };
        }

        const newProgram: WorkoutProgram = {
          ...(program as {
            id: string;
            user_id: string;
            name: string;
            description: string;
            created_at: string;
          }),
          description: program.description || '',
          exercises: ((insertedExercises || []) as ProgramExercise[]).sort((a, b) => a.sort_order - b.sort_order),
        };

        setPrograms((prev) => [newProgram, ...prev]);
        return { error: null };
      },
      deleteProgram: async (programId: string) => {
        const { error } = await supabase.from('workout_programs').delete().eq('id', programId);
        if (error) {
          console.error('Failed to delete program:', error);
          return;
        }

        setPrograms((prev) => prev.filter((p) => p.id !== programId));
      },
      refreshData,
    }),
    [favorites, programs, loading, user]
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = useContext(UserDataContext);

  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }

  return context;
}
