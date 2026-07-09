import { useGetStatsSummary, useGetRecentRuns, useDeleteRun, getGetRecentRunsQueryKey, getListRunsQueryKey, getGetStatsSummaryQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteMap } from '@/components/RouteMap';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Clock, Navigation, MapPin, Trash2, ArrowRight, PlayCircle, Trophy, Moon } from 'lucide-react';
import { Link } from 'wouter';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { LogRunDialog } from '@/components/LogRunDialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatPace(secondsPerKm: number) {
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

const runTypeColor = {
  Easy: 'text-green-500 bg-green-50',
  Tempo: 'text-orange-500 bg-orange-50',
  Long: 'text-blue-500 bg-blue-50',
  Recovery: 'text-gray-500 bg-gray-100',
  Interval: 'text-purple-500 bg-purple-50',
};

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: recentRuns, isLoading: runsLoading } = useGetRecentRuns({ limit: 4 });
  const deleteRun = useDeleteRun();
  const queryClient = useQueryClient();

  const lastRun = recentRuns?.[0];
  const otherRecentRuns = recentRuns?.slice(1, 4) || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this run?")) {
      deleteRun.mutate({ id }, {
        onSuccess: () => {
          toast.success("Run deleted");
          queryClient.invalidateQueries({ queryKey: getGetRecentRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        }
      });
    }
  };

  // Dummy sparkline data for the stat cards
  const sparkData1 = [{v: 4}, {v: 6}, {v: 3}, {v: 8}, {v: 5}, {v: 9}];
  const sparkData2 = [{v: 30}, {v: 45}, {v: 25}, {v: 60}, {v: 40}, {v: 70}];

  const hasSub6010k = stats?.personalRecords?.fastest10k && stats.personalRecords.fastest10k < 6 * 60; // pace < 6min/km roughly means sub 60 10k

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{greeting}, Alex</h1>
        <p className="text-gray-500 mt-1">Ready for your next run?</p>
      </motion.div>

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="relative rounded-3xl overflow-hidden h-[240px] md:h-[280px] bg-black shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=80" 
            alt="Runner" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
            <div className="max-w-md">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                You don't find willpower,<br/>you create it.
              </h2>
              <p className="text-gray-300 mt-2 font-medium">Keep showing up.</p>
            </div>
            
            <LogRunDialog>
              <Button className="w-fit rounded-full bg-lime-400 text-black hover:bg-lime-500 font-bold px-6 py-6 shadow-[0_0_20px_rgba(204,255,0,0.3)]">
                <PlayCircle className="mr-2 w-5 h-5" />
                Start a Run
              </Button>
            </LogRunDialog>
          </div>
        </div>
      </motion.div>

      {/* This Week Stats */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">This Week</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Distance" 
            value={statsLoading ? null : `${stats?.thisWeek?.distance?.toFixed(1) || 0} km`}
            icon={<Activity className="w-4 h-4 text-lime-500" />}
            sparkData={sparkData1}
            loading={statsLoading}
          />
          <StatCard 
            title="Time" 
            value={statsLoading ? null : formatDuration(stats?.thisWeek?.duration || 0)}
            icon={<Clock className="w-4 h-4 text-lime-500" />}
            sparkData={sparkData2}
            loading={statsLoading}
          />
          <StatCard 
            title="Elevation" 
            value={statsLoading ? null : `${stats?.thisWeek?.elevation || 0} m`}
            icon={<Navigation className="w-4 h-4 text-lime-500" />}
            sparkData={sparkData1}
            loading={statsLoading}
          />
          <StatCard 
            title="Runs" 
            value={statsLoading ? null : `${stats?.thisWeek?.runs || 0}`}
            icon={<Activity className="w-4 h-4 text-lime-500" />}
            sparkData={sparkData2}
            loading={statsLoading}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Your Last Run */}
          <div>
            <h3 className="text-lg font-bold mb-4">Your Last Run</h3>
            {runsLoading ? (
              <Skeleton className="h-[400px] w-full rounded-3xl" />
            ) : lastRun ? (
              <Card className="overflow-hidden border-0 shadow-sm rounded-3xl group relative">
                <Link href={`/runs/${lastRun.id}`}>
                  <div className="relative h-48 w-full bg-gray-100">
                    <RouteMap route={lastRun.route ?? null} className="h-full w-full absolute inset-0" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                      <div className="bg-white/90 backdrop-blur text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm pointer-events-auto">
                        {format(parseISO(lastRun.date), 'MMM d, yyyy')}
                      </div>
                      <Button size="sm" className="bg-lime-400 text-black hover:bg-lime-500 rounded-full font-bold pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        View Run
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-5 grid grid-cols-4 gap-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="col-span-4 mb-2 flex items-center justify-between">
                      <h4 className="font-bold text-lg">{lastRun.name || `${lastRun.type} Run`}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${runTypeColor[lastRun.type as keyof typeof runTypeColor]}`}>
                        {lastRun.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Distance</p>
                      <p className="font-bold text-lg">{lastRun.distance.toFixed(1)} <span className="text-sm font-medium text-gray-500">km</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time</p>
                      <p className="font-bold text-lg">{formatDuration(lastRun.duration)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Pace</p>
                      <p className="font-bold text-lg">{formatPace(lastRun.pace)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Calories</p>
                      <p className="font-bold text-lg">{lastRun.calories || '--'}</p>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ) : (
              <Card className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <MapPin className="text-gray-400" />
                </div>
                <h4 className="font-bold mb-1">No runs yet</h4>
                <p className="text-sm text-gray-500 mb-6">Log your first run to see it here.</p>
                <LogRunDialog>
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full">Log a Run</Button>
                </LogRunDialog>
              </Card>
            )}
          </div>

          {/* Recent Runs List */}
          {otherRecentRuns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Recent Runs</h3>
                <Link href="/runs" className="text-sm font-semibold text-gray-500 hover:text-black flex items-center">
                  See all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-3">
                {otherRecentRuns.map((run) => (
                  <Link key={run.id} href={`/runs/${run.id}`} className="block group">
                    <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-all overflow-hidden flex items-center p-3 bg-white">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                        <RouteMap route={run.route ?? null} className="w-full h-full absolute inset-0 opacity-80" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-bold text-sm line-clamp-1">{run.name || `${run.type} Run`}</h4>
                        <p className="text-xs text-gray-500">{format(parseISO(run.date), 'MMM d')} • {run.type}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold">{run.distance.toFixed(1)} km</p>
                        <p className="text-xs text-gray-500">{formatPace(run.pace)}</p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(run.id, e)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 mr-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Weekly Progress */}
          <div>
            <h3 className="text-lg font-bold mb-4">Weekly Progress</h3>
            <Card className="border-0 shadow-sm rounded-3xl p-6 bg-black text-white">
              {statsLoading ? (
                <Skeleton className="h-32 w-full bg-gray-800 rounded-2xl" />
              ) : (
                <>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-gray-400 font-medium text-sm mb-1">Goal</p>
                      <h4 className="text-2xl font-black">{stats?.weekProgress.completed} <span className="text-gray-500 text-lg font-bold">of {stats?.weekProgress.goal} runs</span></h4>
                    </div>
                    <div className="text-4xl font-black text-lime-400">
                      {stats?.weekProgress.percentage}%
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-6">
                    <div 
                      className="h-full bg-lime-400 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${stats?.weekProgress.percentage || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between">
                    {stats?.weeklyRunDays.map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          day.hasRun ? 'bg-lime-400 text-black' : 
                          day.isToday ? 'bg-gray-800 text-white ring-2 ring-gray-600' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {day.hasRun ? '✓' : day.dayLabel[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Upcoming Workout */}
          <div>
            <h3 className="text-lg font-bold mb-4">Upcoming</h3>
            <Card className="border border-gray-100 shadow-sm rounded-3xl p-5 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Tempo Run</h4>
                  <p className="text-xs text-gray-500 font-medium">Tomorrow, 6:30 AM</p>
                </div>
              </div>
              <div className="flex gap-4 mb-4 text-sm font-medium">
                <div>
                  <span className="text-gray-500 block text-xs">Distance</span>
                  8.0 km
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Target Pace</span>
                  5:40 /km
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
                View Workout
              </Button>
            </Card>
          </div>

          {/* Achievements */}
          <div>
            <h3 className="text-lg font-bold mb-4">Achievements</h3>
            <div className="space-y-3">
              <Card className={`border-0 shadow-sm rounded-2xl p-4 flex gap-4 items-center ${hasSub6010k ? 'bg-white' : 'bg-gray-50 opacity-60 grayscale'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${hasSub6010k ? 'bg-lime-100 text-lime-600' : 'bg-gray-200 text-gray-400'}`}>
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">10K Crusher</h4>
                  <p className="text-xs text-gray-500 mt-1">Completed a 10K in under 60 minutes</p>
                </div>
              </Card>
              
              <Card className="border-0 shadow-sm rounded-2xl p-4 flex gap-4 items-center bg-white">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Early Bird</h4>
                  <p className="text-xs text-gray-500 mt-1">Completed 5 runs before 7 AM</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, sparkData, loading }: { title: string, value: React.ReactNode, icon: React.ReactNode, sparkData: any[], loading: boolean }) {
  return (
    <Card className="border-0 shadow-sm rounded-3xl p-4 bg-white relative overflow-hidden group">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 mt-1 rounded-lg" />
      ) : (
        <div className="font-black text-2xl tracking-tight">{value}</div>
      )}
      
      <div className="h-10 mt-2 -mx-4 -mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#CCFF00" fillOpacity={1} fill={`url(#spark-${title})`} strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
