import { useRef, useState } from 'react';
import { useWorkout, MUSCLE_CATEGORIES } from '../context/WorkoutContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Check, X, Sparkles, Clock, Search, Loader2, Dumbbell, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import confetti from 'canvas-confetti';
import { Exercise, getExerciseById, getExercisesByCategoryPage } from '../services/exerciseApi';
import { useEffect } from 'react';
import { useUserData } from '../context/UserDataContext';

const PAGE_SIZE = 10;

export function ActiveWorkout() {
  const { currentSession, startWorkout, addSet, finishWorkout, cancelWorkout } = useWorkout();
  const { isFavorite, toggleFavorite } = useUserData();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MUSCLE_CATEGORIES | null>(
    location.state?.category || null
  );
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(8);

  // Load exercises when category is selected
  useEffect(() => {
    if (selectedCategory && !currentSession) {
      loadExercises(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory || currentSession || !hasMore || loading || loadingMore) {
      return;
    }

    const target = loadMoreTriggerRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '120px',
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [selectedCategory, currentSession, hasMore, loading, loadingMore, currentPage]);

  const loadExercises = async (category: keyof typeof MUSCLE_CATEGORIES) => {
    setLoading(true);
    try {
      const result = await getExercisesByCategoryPage(category, 0, PAGE_SIZE);
      setExercises(result.exercises);
      setCurrentPage(0);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      setExercises([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!selectedCategory || loadingMore || loading || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getExercisesByCategoryPage(selectedCategory, nextPage, PAGE_SIZE);

      setExercises((prev) => {
        const merged = [...prev, ...result.exercises];
        const uniqueById = new Map<string, Exercise>();
        for (const exercise of merged) {
          uniqueById.set(exercise.id, exercise);
        }
        return Array.from(uniqueById.values());
      });

      setCurrentPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more exercises:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStartWorkout = (exercise: Exercise) => {
    if (selectedCategory) {
      startWorkout(selectedCategory, exercise.name, exercise.id);
      setSelectedExercise(exercise);
    }
  };

  const handleOpenExerciseDetail = (exercise: Exercise) => {
    if (!selectedCategory) {
      return;
    }

    navigate(`/exercises/${exercise.id}`, {
      state: {
        category: selectedCategory,
        from: 'workout',
      },
    });
  };

  const handleAddSet = () => {
    if (weight > 0 && reps > 0) {
      addSet(weight, reps);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74']
      });
    }
  };

  const handleFinishWorkout = () => {
    finishWorkout();
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 }
    });
    setTimeout(() => navigate('/'), 1000);
  };

  const handleCancelWorkout = () => {
    cancelWorkout();
    setSelectedCategory(null);
    setSelectedExercise(null);
  };

  const quickAdjust = (type: 'weight' | 'reps', delta: number) => {
    if (type === 'weight') {
      setWeight(prev => Math.max(0, prev + delta));
    } else {
      setReps(prev => Math.max(0, prev + delta));
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const resolveActiveExercise = async () => {
      if (!currentSession?.exerciseId || selectedExercise?.id === currentSession.exerciseId) {
        return;
      }

      const detail = await getExerciseById(currentSession.exerciseId);
      if (detail) {
        setSelectedExercise(detail);
      }
    };

    resolveActiveExercise();
  }, [currentSession?.exerciseId]);

  // Selection Phase
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-black px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Start Workout</h1>
          <p className="text-slate-400">Choose your exercise category</p>
        </motion.div>

        {/* Category Selection */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(MUSCLE_CATEGORIES).map(([key, category]) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(key as keyof typeof MUSCLE_CATEGORIES)}
                className="aspect-square bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-orange-500 transition-all"
              >
                <div className="text-5xl">{category.icon}</div>
                <div className="text-white font-bold">{category.name}</div>
                <div className="text-slate-400 text-xs">{category.role}</div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Exercise Selection */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button 
              onClick={() => {
                setSelectedCategory(null);
                setExercises([]);
                setCurrentPage(0);
                setHasMore(false);
                setSearchQuery('');
              }}
              className="text-orange-500 font-medium mb-4 flex items-center gap-2"
            >
              ← Back to categories
            </button>

            <div className="mb-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading exercises...</p>
              </div>
            ) : filteredExercises.length > 0 ? (
              <div className="space-y-3">
                {filteredExercises.map((exercise) => (
                  <motion.div
                    key={exercise.id}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-4 text-left hover:border-orange-500 transition-all flex gap-4"
                  >
                    <button onClick={() => handleOpenExerciseDetail(exercise)} className="flex gap-4 flex-1 text-left">
                      <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={exercise.gifUrl} 
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg mb-1 capitalize">
                          {exercise.name}
                        </div>
                        <div className="text-slate-400 text-sm flex items-center gap-2 flex-wrap">
                          <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded text-xs">
                            {exercise.target}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span>{exercise.equipment}</span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-start">
                      <button
                        onClick={() => toggleFavorite(exercise)}
                        className={`p-2 rounded-lg transition-all ${
                          isFavorite(exercise.id)
                            ? 'text-red-400 bg-red-500/10'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isFavorite(exercise.id) ? 'Remove favorite' : 'Add favorite'}
                      >
                        <Heart size={18} fill={isFavorite(exercise.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {hasMore && (
                  <div className="pt-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-slate-300 hover:border-orange-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? 'Loading more...' : 'Load more exercises'}
                    </button>
                  </div>
                )}

                {loadingMore && (
                  <div className="flex items-center justify-center py-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Loading more exercises...
                  </div>
                )}

                <div ref={loadMoreTriggerRef} className="h-1" aria-hidden="true" />
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
                <Dumbbell size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No exercises found</h3>
                <p className="text-slate-400">
                  {exercises.length > 0 ? 'Try a different search term' : 'No data in this category yet'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  // Active Workout Phase
  const category = MUSCLE_CATEGORIES[currentSession.category];
  const currentExp = weight * reps;

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleCancelWorkout} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={18} />
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{category.icon}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white capitalize">{currentSession.exercise}</h1>
            <p className="text-slate-400 text-sm">{category.name} - {category.role}</p>
          </div>
        </div>

        {/* Exercise Animation */}
        {selectedExercise && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 mb-6"
          >
            <img 
              src={selectedExercise.gifUrl}
              alt={selectedExercise.name}
              className="w-full h-64 object-contain bg-slate-800"
            />
            <div className="p-4">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-lg text-sm font-medium">
                  Target: {selectedExercise.target}
                </span>
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm">
                  {selectedExercise.equipment}
                </span>
              </div>
              {selectedExercise.secondaryMuscles.length > 0 && (
                <div className="text-slate-400 text-xs">
                  <span className="font-medium">Secondary:</span> {selectedExercise.secondaryMuscles.join(', ')}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Input Controls */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl p-6 mb-6 border border-slate-800"
      >
        {/* Weight Input */}
        <div className="mb-6">
          <label className="text-slate-400 text-sm mb-3 block font-medium">Weight (kg)</label>
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => quickAdjust('weight', -5)}
              className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-white border-2 border-slate-700 active:border-orange-500"
            >
              <Minus size={24} />
            </motion.button>
            
            <div className="flex-1 bg-black rounded-xl p-4 text-center border-2 border-slate-800">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-4xl font-black text-center bg-transparent text-orange-500 outline-none"
              />
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => quickAdjust('weight', 5)}
              className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-white border-2 border-slate-700 active:border-orange-500"
            >
              <Plus size={24} />
            </motion.button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[2.5, 5, 10, 20].map((delta) => (
              <button
                key={delta}
                onClick={() => quickAdjust('weight', delta)}
                className="py-2.5 bg-slate-800 rounded-lg text-sm font-medium text-slate-300 border border-slate-700 hover:border-orange-500 transition-all"
              >
                +{delta}
              </button>
            ))}
          </div>
        </div>

        {/* Reps Input */}
        <div className="mb-6">
          <label className="text-slate-400 text-sm mb-3 block font-medium">Reps</label>
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => quickAdjust('reps', -1)}
              className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-white border-2 border-slate-700 active:border-orange-500"
            >
              <Minus size={24} />
            </motion.button>
            
            <div className="flex-1 bg-black rounded-xl p-4 text-center border-2 border-slate-800">
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-4xl font-black text-center bg-transparent text-orange-500 outline-none"
              />
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => quickAdjust('reps', 1)}
              className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-white border-2 border-slate-700 active:border-orange-500"
            >
              <Plus size={24} />
            </motion.button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5].map((delta) => (
              <button
                key={delta}
                onClick={() => quickAdjust('reps', delta)}
                className="py-2.5 bg-slate-800 rounded-lg text-sm font-medium text-slate-300 border border-slate-700 hover:border-orange-500 transition-all"
              >
                +{delta}
              </button>
            ))}
          </div>
        </div>

        {/* EXP Preview */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={20} className="text-orange-500" />
            <span className="text-orange-500 font-bold text-lg">+{currentExp} XP</span>
          </div>
        </div>

        {/* Add Set Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAddSet}
          disabled={weight === 0 || reps === 0}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check size={24} />
          Complete Set
        </motion.button>
      </motion.div>

      {/* Sets History */}
      {currentSession.sets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Sets Completed</h3>
            <div className="text-orange-500 font-bold">
              {currentSession.totalExp} XP
            </div>
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {currentSession.sets.map((set, index) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {set.weight}kg × {set.reps} reps
                      </div>
                      <div className="text-slate-400 text-sm">Set {index + 1}</div>
                    </div>
                  </div>
                  <div className="text-orange-500 font-bold">
                    +{set.exp}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Finish Workout Button */}
      {currentSession.sets.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFinishWorkout}
          className="w-full bg-white text-black font-bold py-4 rounded-xl"
        >
          Finish Workout
        </motion.button>
      )}
    </div>
  );
}
