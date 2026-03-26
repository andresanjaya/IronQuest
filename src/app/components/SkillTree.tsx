import { useWorkout, MUSCLE_CATEGORIES } from '../context/WorkoutContext';
import { motion } from 'motion/react';
import { TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SkillTree() {
  const { stats, totalExp } = useWorkout();
  const { userLevel } = useAuth();

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-black text-white mb-2">Level Up In</h1>
        <h2 className="text-3xl font-black text-white mb-4">66 Days</h2>
      </motion.div>

      {/* Rating Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Your Rating</h3>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-white text-black rounded-lg font-bold text-xs">
              CURRENT RATING
            </button>
            <button className="px-4 py-1.5 bg-slate-800 text-slate-400 rounded-lg font-medium text-xs">
              POTENTIAL
            </button>
          </div>
        </div>

        {/* Level Display */}
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-orange-500 rounded-2xl w-32 h-32 flex flex-col items-center justify-center flex-shrink-0">
            <div className="text-6xl font-black text-white">{userLevel}</div>
            <div className="text-white text-xs font-bold uppercase tracking-wider">Level</div>
          </div>
          
          <div className="flex-1 pt-4">
            <div className="text-right mb-3">
              <div className="text-white text-3xl font-bold">{totalExp.toLocaleString()}</div>
              <div className="text-slate-400 text-xs">XP earned</div>
            </div>
            
            {/* Progress Bars */}
            <div className="space-y-1.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full ${
                    i < Math.floor((userLevel / 10) * 20) 
                      ? 'bg-orange-500' 
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats List */}
        <div className="space-y-4">
          {Object.entries(stats).map(([key, stat]) => {
            const category = MUSCLE_CATEGORIES[key as keyof typeof MUSCLE_CATEGORIES];
            
            // Calculate color based on rating
            const getStatColor = (rating: number) => {
              if (rating >= 150) return 'text-green-500';
              if (rating >= 100) return 'text-blue-500';
              if (rating >= 50) return 'text-yellow-500';
              return 'text-slate-400';
            };

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="text-xl">{category.icon}</span>
                    <span className={`font-bold text-sm uppercase tracking-wide ${getStatColor(stat.rating)}`}>
                      {category.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-500" />
                  <span className={`font-black text-2xl ${getStatColor(stat.rating)}`}>
                    {stat.rating}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievement Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900 rounded-2xl p-8 border border-slate-800 flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative mb-6"
        >
          {/* Badge Circle */}
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-slate-700 flex items-center justify-center relative">
            {/* Laurel Wreath */}
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
              🏆
            </div>
            
            {/* Badge Content */}
            <div className="text-center relative z-10">
              <Award size={48} className="text-orange-500 mx-auto mb-2" />
              <div className="text-white font-black text-3xl">#{userLevel}</div>
            </div>
          </div>
        </motion.div>

        <h3 className="text-white font-bold text-xl mb-2">Self-Improvement</h3>
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-orange-500">★</span>
          ))}
        </div>
        <p className="text-slate-400 text-sm text-center">
          Keep pushing your limits and level up!
        </p>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-slate-900/50 rounded-xl p-5 border border-slate-800"
      >
        <h4 className="text-white font-bold mb-3">💡 Pro Tips</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-orange-500">•</span>
            <span>Complete workouts consistently to increase your ratings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500">•</span>
            <span>Each category can reach a maximum rating of 999</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500">•</span>
            <span>Higher weights and more reps = more XP earned</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
