import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

type TrainingLog = {
  id: string;
  category: string;
  exercise: string;
  workout_date: string;
  total_exp: number;
  total_sets: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  push: 'bg-rose-500',
  pull: 'bg-cyan-500',
  legs: 'bg-violet-500',
  chest: 'bg-emerald-500',
  back: 'bg-amber-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Leg Day',
  chest: 'Chest Day',
  back: 'Back Day',
};

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function TrainingCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      if (!user) {
        setLogs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('training_logs')
        .select('id,category,exercise,workout_date,total_exp,total_sets')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

      if (error) {
        console.error('Failed to load training logs:', error);
        setLogs([]);
      } else {
        setLogs((data || []) as TrainingLog[]);
      }
      setLoading(false);
    };

    loadLogs();
  }, [user?.id]);

  const logsByDate = useMemo(() => {
    return logs.reduce((acc, item) => {
      const key = toDateKey(new Date(item.workout_date));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, TrainingLog[]>);
  }, [logs]);

  const selectedKey = toDateKey(selectedDate);
  const selectedLogs = logsByDate[selectedKey] || [];

  const dayContent = ({ date }: { date: Date }) => {
    const key = toDateKey(date);
    const categories = Array.from(new Set((logsByDate[key] || []).map((log) => log.category))).slice(0, 3);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{date.getDate()}</span>
        {categories.length > 0 && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            {categories.map((category) => (
              <span
                key={`${key}-${category}`}
                className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[category] || 'bg-slate-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-2">Training Calendar</h1>
        <p className="text-slate-400">Track record latihan kamu per tanggal.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-6">
        {loading ? (
          <div className="py-16 text-slate-400 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading calendar...
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            components={{
              DayContent: dayContent,
            }}
            className="text-white"
          />
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
        <h2 className="text-white font-bold mb-3">Legend</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[key]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <CalendarIcon size={18} />
          {format(selectedDate, 'EEEE, d MMMM yyyy')}
        </h2>

        {selectedLogs.length === 0 ? (
          <p className="text-slate-400 text-sm">Belum ada training di tanggal ini.</p>
        ) : (
          <div className="space-y-2">
            {selectedLogs.map((log) => (
              <div key={log.id} className="bg-black border border-slate-800 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold capitalize">{log.exercise}</span>
                  <span className="text-xs text-slate-400 capitalize">{CATEGORY_LABELS[log.category] || log.category}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {log.total_sets} sets • {log.total_exp} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
