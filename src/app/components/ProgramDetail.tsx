import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { useUserData } from '../context/UserDataContext';

export function ProgramDetail() {
  const { id } = useParams();
  const { programs, loading } = useUserData();

  if (!id) {
    return <Navigate to="/programs" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-8 text-slate-300">
        Loading program...
      </div>
    );
  }

  const program = programs.find((item) => item.id === id);

  if (!program) {
    return (
      <div className="min-h-screen bg-black px-4 py-8">
        <Link to="/programs" className="text-orange-500 inline-flex items-center gap-2 mb-4">
          <ChevronLeft size={18} /> Back to programs
        </Link>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
          Program tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link to="/programs" className="text-orange-500 inline-flex items-center gap-2 mb-4">
          <ChevronLeft size={18} /> Back to programs
        </Link>
        <h1 className="text-3xl font-black text-white mb-1">{program.name}</h1>
        <p className="text-slate-400">{program.description || 'No description'}</p>
      </motion.div>

      <div className="space-y-3">
        {program.exercises.map((exercise, index) => (
          <Link
            key={exercise.id}
            to={`/exercises/${exercise.exercise_id}`}
            state={{
              category: exercise.body_part?.toLowerCase().includes('chest')
                ? 'chest'
                : exercise.body_part?.toLowerCase().includes('back')
                  ? 'back'
                  : exercise.body_part?.toLowerCase().includes('shoulder')
                    ? 'push'
                    : exercise.body_part?.toLowerCase().includes('leg') || exercise.body_part?.toLowerCase().includes('waist')
                      ? 'legs'
                      : 'pull',
            }}
            className="block bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-orange-500 transition-all"
          >
            <div className="flex gap-3">
              <img
                src={exercise.gif_url}
                alt={exercise.name}
                className="w-20 h-20 rounded-lg object-cover bg-slate-800"
              />
              <div className="flex-1">
                <div className="text-xs text-orange-500 font-bold mb-1">Step {index + 1}</div>
                <h3 className="text-white text-xl font-bold capitalize leading-tight">{exercise.name}</h3>
                <p className="text-slate-400 text-sm capitalize mt-2">
                  {exercise.target} • {exercise.body_part} • {exercise.equipment}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
