import { motion } from 'motion/react';
import { Heart, Trash2 } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

export function Favorites() {
  const { favorites, loading, toggleFavorite } = useUserData();

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-black text-white mb-2">Favorites</h1>
        <p className="text-slate-400">Latihan favorit kamu tersimpan di cloud.</p>
      </motion.div>

      {loading ? (
        <div className="text-slate-400">Loading favorites...</div>
      ) : favorites.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <Heart className="mx-auto text-slate-500 mb-3" />
          <h3 className="text-white font-bold mb-2">Belum ada favorite</h3>
          <p className="text-slate-400 text-sm">Tandai exercise di halaman library untuk menyimpan ke sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4"
            >
              <img
                src={favorite.gif_url}
                alt={favorite.name}
                className="w-16 h-16 rounded-lg object-cover bg-slate-800"
              />
              <div className="flex-1">
                <h3 className="text-white font-bold capitalize">{favorite.name}</h3>
                <p className="text-slate-400 text-sm capitalize">
                  {favorite.target} • {favorite.body_part} • {favorite.equipment}
                </p>
              </div>
              <button
                onClick={() =>
                  toggleFavorite({
                    id: favorite.exercise_id,
                    name: favorite.name,
                    gifUrl: favorite.gif_url,
                    target: favorite.target,
                    bodyPart: favorite.body_part,
                    equipment: favorite.equipment,
                    secondaryMuscles: [],
                    instructions: [],
                  })
                }
                className="text-red-400 hover:text-red-300"
                title="Remove from favorites"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
