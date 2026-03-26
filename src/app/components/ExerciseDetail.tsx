import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Dumbbell, Heart, Loader2 } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { type Exercise, getExerciseById } from '../services/exerciseApi';
import { useWorkout } from '../context/WorkoutContext';
import { useUserData } from '../context/UserDataContext';

function deriveCategoryFromBodyPart(bodyPart: string): 'push' | 'pull' | 'chest' | 'back' | 'legs' {
  const value = bodyPart.toLowerCase();

  if (value.includes('chest')) {
    return 'chest';
  }
  if (value.includes('back')) {
    return 'back';
  }
  if (value.includes('shoulder') || value.includes('upper arm')) {
    return 'push';
  }
  if (value.includes('leg') || value.includes('waist')) {
    return 'legs';
  }

  return 'pull';
}

export function ExerciseDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessions, startWorkout } = useWorkout();
  const { isFavorite, toggleFavorite } = useUserData();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedCategory = (location.state?.category as 'push' | 'pull' | 'chest' | 'back' | 'legs' | undefined)
    ?? (exercise ? deriveCategoryFromBodyPart(exercise.bodyPart) : undefined);

  useEffect(() => {
    let mounted = true;

    const loadExercise = async () => {
      if (!exerciseId) {
        return;
      }

      setLoading(true);
      const detail = await getExerciseById(exerciseId);
      if (mounted) {
        setExercise(detail);
        setLoading(false);
      }
    };

    loadExercise();

    return () => {
      mounted = false;
    };
  }, [exerciseId]);

  const exerciseSessions = useMemo(() => {
    if (!exercise) {
      return [];
    }

    const normalized = exercise.name.trim().toLowerCase();
    return sessions.filter(
      (session) => session.exerciseId === exercise.id || session.exercise.trim().toLowerCase() === normalized
    );
  }, [sessions, exercise]);

  const stats = useMemo(() => {
    const allSets = exerciseSessions.flatMap((session) => session.sets);
    const totalSets = allSets.length;
    const heaviestWeight = allSets.reduce((max, item) => Math.max(max, item.weight), 0);
    const totalVolume = allSets.reduce((sum, item) => sum + item.weight * item.reps, 0);

    return {
      sessions: exerciseSessions.length,
      totalSets,
      heaviestWeight,
      totalVolume,
      lastSession: exerciseSessions[0] || null,
    };
  }, [exerciseSessions]);

  if (!exerciseId) {
    return <Navigate to="/workout" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-300 px-4 py-8 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin mr-2" /> Loading exercise...
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-black px-4 py-8">
        <Link to="/workout" className="text-orange-500 inline-flex items-center gap-2 mb-4">
          <ChevronLeft size={18} /> Back
        </Link>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
          Exercise tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-500 inline-flex items-center gap-2"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <button
            onClick={() => toggleFavorite(exercise)}
            className={`p-2 rounded-lg transition-all ${
              isFavorite(exercise.id)
                ? 'text-red-400 bg-red-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isFavorite(exercise.id) ? 'Remove favorite' : 'Add favorite'}
          >
            <Heart size={18} fill={isFavorite(exercise.id) ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h1 className="text-3xl font-black text-white capitalize mb-2">{exercise.name}</h1>
        <p className="text-slate-400 capitalize">
          {exercise.target} • {exercise.bodyPart} • {exercise.equipment}
        </p>
      </motion.div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5">
        <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-72 object-contain bg-slate-800" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-slate-400 text-xs">Total Sessions</p>
          <p className="text-white text-2xl font-black">{stats.sessions}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-slate-400 text-xs">Total Sets</p>
          <p className="text-white text-2xl font-black">{stats.totalSets}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-slate-400 text-xs">Heaviest Weight</p>
          <p className="text-white text-2xl font-black">{stats.heaviestWeight} kg</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-slate-400 text-xs">Total Volume</p>
          <p className="text-white text-2xl font-black">{stats.totalVolume}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
        <h2 className="text-white font-bold mb-3">Detail Set Terakhir</h2>
        {stats.lastSession && stats.lastSession.sets.length > 0 ? (
          <div className="space-y-2">
            {stats.lastSession.sets.map((setItem, index) => (
              <div key={setItem.id} className="bg-black border border-slate-800 rounded-lg px-3 py-2 text-sm">
                <span className="text-orange-500 mr-2">Set {index + 1}</span>
                <span className="text-white">{setItem.weight} kg</span>
                <span className="text-slate-400"> x {setItem.reps} reps</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Belum ada riwayat set untuk exercise ini.</p>
        )}
      </div>

      <button
        onClick={() => {
          if (!selectedCategory) {
            return;
          }

          startWorkout(selectedCategory, exercise.name, exercise.id);
          navigate('/workout', {
            state: {
              category: selectedCategory,
            },
          });
        }}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2"
      >
        <Dumbbell size={18} /> Start Training
      </button>
    </div>
  );
}
