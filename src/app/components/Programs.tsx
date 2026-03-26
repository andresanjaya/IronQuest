import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Trash2, X, Eye, ChevronLeft } from 'lucide-react';
import { type Exercise, searchExercisesRemote } from '../services/exerciseApi';
import { useUserData } from '../context/UserDataContext';
import { Link } from 'react-router';

export function Programs() {
  const { programs, createProgram, deleteProgram } = useUserData();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setQuery('');
    setSearchResults([]);
    setSelectedExercises([]);
    setSaving(false);
    setError(null);
  };

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await searchExercisesRemote(query, 10);
      setSearchResults(results);
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const addExercise = (exercise: Exercise) => {
    if (selectedExercises.some((item) => item.id === exercise.id)) {
      return;
    }
    setSelectedExercises((prev) => [...prev, exercise]);
  };

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((item) => item.id !== exerciseId));
  };

  const handleCreateProgram = async () => {
    setSaving(true);
    setError(null);

    const response = await createProgram(name, description, selectedExercises);

    if (response.error) {
      setError(response.error);
      setSaving(false);
      return;
    }

    resetForm();
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="text-3xl font-black text-white">Programs</h1>
          {!isCreating && (
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-3 py-2 text-sm font-bold inline-flex items-center gap-1"
            >
              <Plus size={14} /> Tambah
            </button>
          )}
        </div>
        <p className="text-slate-400">Buat rangkaian latihan kamu sendiri dan simpan ke database.</p>
      </motion.div>

      {isCreating ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 space-y-4">
          <button
            onClick={() => {
              resetForm();
              setIsCreating(false);
            }}
            className="text-orange-500 font-medium inline-flex items-center gap-1"
          >
            <ChevronLeft size={16} /> Kembali ke list
          </button>

          <div>
            <label className="text-slate-400 text-sm block mb-1">Program Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
              placeholder="Program 1 - Upper Body Strength"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
              placeholder="3x seminggu, fokus hypertrophy"
              rows={2}
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm block mb-1">Cari exercise</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-black border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-orange-500"
                placeholder="bench, row, squat..."
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-lg">
              {searchResults.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => addExercise(exercise)}
                  className="w-full px-3 py-2 text-left border-b last:border-b-0 border-slate-800 hover:bg-slate-800/60"
                >
                  <div className="text-white capitalize font-medium">{exercise.name}</div>
                  <div className="text-slate-400 text-xs capitalize">
                    {exercise.target} • {exercise.bodyPart}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedExercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Rangkaian exercise</p>
              {selectedExercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="bg-black border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-3"
                >
                  <span className="text-orange-500 font-bold text-sm">{index + 1}</span>
                  <span className="text-white capitalize flex-1">{exercise.name}</span>
                  <button onClick={() => removeExercise(exercise.id)} className="text-slate-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleCreateProgram}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg py-2.5 font-bold flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {saving ? 'Saving...' : 'Save Program'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
              <p className="text-slate-400 mb-4">Belum ada program. Tambah program pertama kamu.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 font-bold inline-flex items-center gap-2"
              >
                <Plus size={16} /> Tambah Program
              </button>
            </div>
          ) : (
            programs.map((program) => (
              <div key={program.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-white font-bold text-lg">{program.name}</h3>
                    <p className="text-slate-400 text-sm">{program.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/programs/${program.id}`}
                      className="text-slate-300 hover:text-white"
                      title="Lihat detail"
                    >
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => deleteProgram(program.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  {program.exercises.slice(0, 3).map((exercise, index) => (
                    <div key={exercise.id} className="bg-black border border-slate-800 rounded-lg px-3 py-2 text-sm">
                      <span className="text-orange-500 mr-2">{index + 1}.</span>
                      <span className="text-white capitalize">{exercise.name}</span>
                      <span className="text-slate-400 ml-2 capitalize">({exercise.target})</span>
                    </div>
                  ))}
                  {program.exercises.length > 3 && (
                    <p className="text-xs text-slate-500">+{program.exercises.length - 3} exercise lainnya</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
