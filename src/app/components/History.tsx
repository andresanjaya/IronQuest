import { useWorkout, MUSCLE_CATEGORIES } from '../context/WorkoutContext';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { format, isToday, isYesterday, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';

export function History() {
  const { sessions, stats, totalExp, streak } = useWorkout();

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Calculate weekly stats for chart
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const weeklyData = daysOfWeek.map(day => {
    const dayString = day.toDateString();
    const daySessions = sessions.filter(s => new Date(s.date).toDateString() === dayString);
    const dayExp = daySessions.reduce((sum, s) => sum + s.totalExp, 0);
    
    return {
      day: format(day, 'EEE'),
      exp: dayExp,
      sessions: daySessions.length
    };
  });

  const maxExp = Math.max(...weeklyData.map(d => d.exp), 1);
  const totalWeekExp = weeklyData.reduce((sum, d) => sum + d.exp, 0);
  const totalSets = sessions.reduce((sum, s) => sum + s.sets.length, 0);

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-black text-white mb-2">See Your</h1>
        <h2 className="text-3xl font-black text-white mb-1">Progress</h2>
      </motion.div>

      {/* Journey Time Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="text-white text-sm font-medium mb-1">Your Journey Time</div>
          <div className="text-white text-5xl font-black mb-3">{streak} Days</div>
          <div className="flex items-center gap-2">
            <div className="text-white font-bold text-lg">STRONG</div>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute top-4 right-4 text-white/20 text-6xl">💪</div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900 rounded-xl p-1 mb-6 flex border border-slate-800"
      >
        <button className="flex-1 py-2 text-sm font-medium text-slate-400">Sleep</button>
        <button className="flex-1 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg">Training</button>
        <button className="flex-1 py-2 text-sm font-medium text-slate-400">Exercise</button>
        <button className="flex-1 py-2 text-sm font-medium text-slate-400">Mind</button>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <Zap size={20} className="text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
          <p className="text-xs text-slate-400">Workouts</p>
        </div>
        
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <TrendingUp size={20} className="text-green-500 mb-2" />
          <p className="text-2xl font-bold text-white">{totalSets}</p>
          <p className="text-xs text-slate-400">Total Sets</p>
        </div>
        
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <BarChart3 size={20} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-white">{totalExp.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Total XP</p>
        </div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-white" />
            <h3 className="text-white font-bold">Training XP</h3>
          </div>
          <button className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-sm font-medium border border-slate-700">
            This week ▼
          </button>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-32 mb-3">
          {weeklyData.map((data, index) => {
            const height = (data.exp / maxExp) * 100;
            const isToday = format(new Date(), 'EEE') === data.day;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                    className={`w-full rounded-t-lg ${
                      isToday ? 'bg-orange-500' : 'bg-orange-500/70'
                    } min-h-[8px]`}
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">{data.day}</span>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-3 border-t border-slate-800">
          <p className="text-slate-400 text-sm">
            You earned <span className="text-white font-bold">{totalWeekExp.toLocaleString()} XP</span> this week
          </p>
        </div>
      </motion.div>

      {/* Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={20} className="text-white" />
          <h3 className="text-white font-bold">Result</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats).slice(0, 4).map(([key, stat]) => {
            const category = MUSCLE_CATEGORIES[key as keyof typeof MUSCLE_CATEGORIES];
            return (
              <div key={key} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-white font-bold text-sm">{category.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-green-500 font-bold text-xl">+{stat.level}%</span>
                  <TrendingUp size={14} className="text-green-500" />
                </div>
                <p className="text-slate-400 text-xs mt-1">Level {stat.level}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Calendar size={20} />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {Object.entries(groupedSessions).slice(0, 5).map(([date, daySessions]) => {
              const dayTotalExp = daySessions.reduce((sum, s) => sum + s.totalExp, 0);
              
              return (
                <div key={date} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm font-medium">{getDateLabel(date)}</span>
                    <span className="text-orange-500 font-bold text-sm">+{dayTotalExp} XP</span>
                  </div>
                  
                  <div className="space-y-2">
                    {daySessions.map((session) => {
                      const category = MUSCLE_CATEGORIES[session.category];
                      return (
                        <div key={session.id} className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{session.exercise}</div>
                            <div className="text-slate-400 text-xs">{session.sets.length} sets</div>
                          </div>
                          <div className="text-slate-400 text-xs">
                            {format(new Date(session.date), 'h:mm a')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-white mb-2">No data yet</h3>
          <p className="text-slate-400">Start working out to see your progress!</p>
        </motion.div>
      )}
    </div>
  );
}
