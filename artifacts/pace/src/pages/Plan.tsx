import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Activity, Flame, Navigation } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

const workoutTypes = {
  Easy: { color: 'bg-green-50 text-green-600', icon: Activity },
  Tempo: { color: 'bg-orange-50 text-orange-600', icon: Flame },
  Long: { color: 'bg-blue-50 text-blue-600', icon: Navigation },
  Rest: { color: 'bg-gray-50 text-gray-500', icon: CalendarIcon },
  Interval: { color: 'bg-purple-50 text-purple-600', icon: Activity },
};

// Mock plan for the week
const plan = [
  { day: 0, type: 'Rest', distance: null, pace: null, desc: 'Rest & Recover' },
  { day: 1, type: 'Easy', distance: 6, pace: '6:15', desc: 'Base building' },
  { day: 2, type: 'Tempo', distance: 8, pace: '5:40', desc: 'Threshold work' },
  { day: 3, type: 'Rest', distance: null, pace: null, desc: 'Active recovery' },
  { day: 4, type: 'Interval', distance: 7, pace: '4:45', desc: '6x400m repeats' },
  { day: 5, type: 'Rest', distance: null, pace: null, desc: 'Pre-long run rest' },
  { day: 6, type: 'Long', distance: 16, pace: '6:30', desc: 'Weekly long run' },
];

export default function Plan() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Training Plan</h1>
        <p className="text-gray-500 mt-1">Your upcoming workouts.</p>
      </motion.div>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="divide-y divide-gray-100">
          {plan.map((workout, idx) => {
            const date = addDays(weekStart, idx);
            const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
            const isPast = date < today && !isToday;
            const style = workoutTypes[workout.type as keyof typeof workoutTypes];
            const Icon = style.icon;

            return (
              <div 
                key={idx} 
                className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center transition-colors
                  ${isToday ? 'bg-lime-50/50' : 'hover:bg-gray-50'}
                  ${isPast ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-4 sm:w-48 flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">{format(date, 'EEEE')}</div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {format(date, 'MMM d')}
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${style.color}`}>
                        {workout.type}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-black text-lime-400">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900">{workout.desc}</p>
                  </div>

                  {workout.type !== 'Rest' && (
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Distance</span>
                        <span className="font-black text-lg">{workout.distance} <span className="text-sm text-gray-500 font-bold">km</span></span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Pace</span>
                        <span className="font-black text-lg">{workout.pace} <span className="text-sm text-gray-500 font-bold">/km</span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
