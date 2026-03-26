import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, Filter, X, Heart } from 'lucide-react';
import { Exercise, fetchAllExercises } from '../services/exerciseApi';
import { Link } from 'react-router';
import { useUserData } from '../context/UserDataContext';

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { isFavorite, toggleFavorite } = useUserData();

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await fetchAllExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.target.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBodyPart = 
      selectedBodyPart === 'all' || ex.bodyPart === selectedBodyPart;

    return matchesSearch && matchesBodyPart;
  });

  const bodyParts = ['all', ...Array.from(new Set(exercises.map(ex => ex.bodyPart)))];

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-slate-400 hover:text-white">
            <X size={24} />
          </Link>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Exercise Library</h1>
        <p className="text-slate-400">Browse {exercises.length}+ exercises</p>
      </motion.div>

      {/* Search Bar */}
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

      {/* Body Part Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-slate-400 text-sm font-medium">Filter by body part</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {bodyParts.map((part) => (
            <button
              key={part}
              onClick={() => setSelectedBodyPart(part)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedBodyPart === part
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-orange-500'
              }`}
            >
              {part === 'all' ? 'All' : part.charAt(0).toUpperCase() + part.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
          <p className="text-slate-400">Loading exercises...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-slate-400 text-sm">
            Showing {filteredExercises.length} exercises
          </div>
          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-4 text-left hover:border-orange-500 transition-all flex gap-4"
              >
                <button onClick={() => setSelectedExercise(exercise)} className="flex gap-4 flex-1 text-left">
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
                      <span>{exercise.bodyPart}</span>
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
          </div>
        </>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-slate-900 rounded-t-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white capitalize">{selectedExercise.name}</h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-800 rounded-2xl overflow-hidden mb-6">
                <img 
                  src={selectedExercise.gifUrl}
                  alt={selectedExercise.name}
                  className="w-full h-80 object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-bold mb-2">Target Muscle</h3>
                  <div className="flex gap-2">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium capitalize">
                      {selectedExercise.target}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm capitalize">
                      {selectedExercise.bodyPart}
                    </span>
                  </div>
                </div>

                {selectedExercise.secondaryMuscles.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold mb-2">Secondary Muscles</h3>
                    <div className="flex gap-2 flex-wrap">
                      {selectedExercise.secondaryMuscles.map((muscle, i) => (
                        <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm capitalize">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-bold mb-2">Equipment</h3>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm capitalize">
                    {selectedExercise.equipment}
                  </span>
                </div>

                {selectedExercise.instructions.length > 0 && (
                  <div>
                    <h3 className="text-white font-bold mb-3">Instructions</h3>
                    <ol className="space-y-2">
                      {selectedExercise.instructions.map((instruction, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-300 text-sm">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
