import { useWorkout, MUSCLE_CATEGORIES } from '../context/WorkoutContext';
import { Flame, Zap, Award, TrendingUp, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

const WORKOUT_IMAGES = {
  push: 'https://images.unsplash.com/photo-1711623350006-91173c261ecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  pull: 'https://images.unsplash.com/photo-1590074121258-6b53b6adb8f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  chest: 'https://images.unsplash.com/photo-1774279922117-4d68af51559e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  back: 'https://images.unsplash.com/photo-1589166928514-b67a63af0235?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  legs: 'https://images.unsplash.com/photo-1734668487493-e33c2f561f13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800'
};

export function Dashboard() {
  const { stats, totalExp, streak, sessions } = useWorkout();
  const { userLevel } = useAuth();

  // Calculate today's workouts
  const today = new Date().toDateString();
  const todayWorkouts = sessions.filter(s => new Date(s.date).toDateString() === today);
  const todayExp = todayWorkouts.reduce((sum, s) => sum + s.totalExp, 0);

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      {/* Header with Day Counter */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-orange-500" />
            <span className="text-orange-500 font-bold text-lg">{streak}</span>
            <Zap size={20} className="text-white" />
            <span className="text-white font-bold text-lg">{todayWorkouts.length}</span>
            <Award size={20} className="text-white" />
            <span className="text-white font-bold text-lg">{totalExp}</span>
          </div>
          <button className="text-white">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="6" r="1" />
              <circle cx="12" cy="18" r="1" />
            </svg>
          </button>
        </div>

        {/* Day Counter */}
        <div className="relative">
          <h1 className="text-5xl font-black text-white mb-1">
            Day {streak}/66
          </h1>
          <p className="text-slate-400 text-sm">You're doing great. Keep going!</p>
        </div>
      </motion.div>

      {/* Action Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        <button className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm">
          To-dos {todayWorkouts.length}
        </button>
        <button className="px-4 py-2 bg-slate-900 text-slate-400 rounded-lg font-medium text-sm">
          Done 0
        </button>
        <Link to="/exercises" className="ml-auto">
          <button className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-orange-500 transition-all">
            <BookOpen size={20} />
          </button>
        </Link>
        <Link to="/workout">
          <button className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all">
            <span className="text-xl">+</span>
          </button>
        </Link>
      </motion.div>

      {/* Workout Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 mb-6"
      >
        {Object.entries(stats).map(([key, stat], index) => {
          const category = MUSCLE_CATEGORIES[key as keyof typeof MUSCLE_CATEGORIES];
          const imageUrl = WORKOUT_IMAGES[key as keyof typeof WORKOUT_IMAGES];
          
          return (
            <Link key={`workout-${key}`} to="/workout" state={{ category: key }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer"
              >
                {/* Background Image */}
                <img 
                  src={imageUrl}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  {/* Top Badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-orange-500 px-2 py-1 rounded-md">
                      <Flame size={14} className="text-white" />
                      <span className="text-white font-bold text-xs">{stat.rating}</span>
                    </div>
                  </div>
                  
                  {/* Bottom Info */}
                  <div>
                    <h3 className="text-white font-bold text-xl mb-1">
                      {category.name} Training
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-300">
                        ⏱ {stat.level}x/week
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">Level {stat.level}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-all" />
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* Level/Rating Card */}
      <Link to="/skills">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900 rounded-2xl p-6 border border-slate-800 cursor-pointer hover:border-orange-500/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
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

          <div className="flex items-end gap-4 mb-6">
            <div className="bg-orange-500 rounded-2xl w-32 h-32 flex flex-col items-center justify-center">
              <div className="text-6xl font-black text-white">{userLevel}</div>
              <div className="text-white text-xs font-bold uppercase">Level</div>
            </div>
            
            <div className="flex-1">
              <div className="text-right mb-2">
                <div className="text-white text-3xl font-bold">{totalExp.toLocaleString()}</div>
                <div className="text-slate-400 text-xs">XP earned</div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Stats List */}
          <div className="space-y-3">
            {Object.entries(stats).map(([key, stat]) => {
              const category = MUSCLE_CATEGORIES[key as keyof typeof MUSCLE_CATEGORIES];
              return (
                <div key={`stat-${key}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-white font-medium text-sm uppercase tracking-wide">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-white font-bold text-lg">{stat.rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </Link>
    </div>
  );
}