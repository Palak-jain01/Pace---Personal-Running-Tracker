import { useGetRun, useDeleteRun, getListRunsQueryKey, getGetRecentRunsQueryKey, getGetStatsSummaryQueryKey, getGetRunQueryKey } from '@workspace/api-client-react';
import { RouteMap } from '@/components/RouteMap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MoreHorizontal, Trash2, Edit2, Activity, Clock, Flame, Navigation, MapPin, CalendarIcon } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPace(secondsPerKm: number) {
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const runTypeColor = {
  Easy: 'text-green-500 bg-green-50 border-green-200',
  Tempo: 'text-orange-500 bg-orange-50 border-orange-200',
  Long: 'text-blue-500 bg-blue-50 border-blue-200',
  Recovery: 'text-gray-500 bg-gray-100 border-gray-300',
  Interval: 'text-purple-500 bg-purple-50 border-purple-200',
};

export default function RunDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: run, isLoading } = useGetRun(id, { query: { enabled: !!id, queryKey: getGetRunQueryKey(id) } });
  const deleteRun = useDeleteRun();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Run not found</h2>
        <Link href="/runs"><Button variant="outline">Back to Runs</Button></Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this run?")) {
      deleteRun.mutate({ id }, {
        onSuccess: () => {
          toast.success("Run deleted");
          queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          setLocation('/runs');
        }
      });
    }
  };

  let splits: number[] = [];
  try {
    if (run.splits) {
      splits = JSON.parse(run.splits);
    }
  } catch(e) {}

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-0">
      <Link href="/runs" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-black mb-2 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Runs
      </Link>

      {/* Hero Map Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden shadow-md">
        <RouteMap route={run.route ?? null} className="h-64 sm:h-80 w-full" />
        
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="bg-white/90 backdrop-blur text-black hover:bg-white rounded-full shadow-sm">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-48">
              <DropdownMenuItem className="py-3 font-medium cursor-pointer" onClick={() => toast.info("Edit not implemented yet")}>
                <Edit2 className="w-4 h-4 mr-2 text-gray-400" /> Edit Run
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 font-medium text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Run
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex flex-col items-start gap-2">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur shadow-sm ${runTypeColor[run.type as keyof typeof runTypeColor]}`}>
            {run.type}
          </div>
        </div>
      </motion.div>

      {/* Title & Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">{run.name || `${run.type} Run`}</h1>
          <p className="text-gray-500 font-medium flex items-center gap-2 mt-2">
            <CalendarIcon className="w-4 h-4" />
            {format(parseISO(run.date), 'EEEE, MMMM do, yyyy • h:mm a')}
          </p>
        </div>
      </motion.div>

      {/* Main Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Distance</span>
          </div>
          <div className="font-black text-3xl tracking-tight">{run.distance.toFixed(2)} <span className="text-base text-gray-400 font-bold">km</span></div>
        </Card>
        <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Time</span>
          </div>
          <div className="font-black text-3xl tracking-tight">{formatDuration(run.duration)}</div>
        </Card>
        <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Pace</span>
          </div>
          <div className="font-black text-3xl tracking-tight">{formatPace(run.pace)}<span className="text-base text-gray-400 font-bold">/km</span></div>
        </Card>
        <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Calories</span>
          </div>
          <div className="font-black text-3xl tracking-tight">{run.calories || '--'}</div>
        </Card>
      </motion.div>

      {/* Splits Table */}
      {splits.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-6">
          <h3 className="text-xl font-bold mb-4">Splits</h3>
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
            <div className="divide-y border-gray-100">
              {splits.map((splitSecs, i) => {
                const fastestSplit = Math.min(...splits);
                const slowestSplit = Math.max(...splits);
                const isFastest = splitSecs === fastestSplit;
                
                // Calculate width percentage relative to slowest split (100%)
                const barWidth = `${(splitSecs / slowestSplit) * 100}%`;

                return (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="font-bold text-gray-500 w-12">{i + 1} km</div>
                    <div className="flex-1 px-4 relative">
                      <div className="w-full bg-gray-100 h-8 rounded-md overflow-hidden flex items-center px-3 relative">
                        <div 
                          className={`absolute left-0 top-0 bottom-0 opacity-20 ${isFastest ? 'bg-lime-500' : 'bg-gray-400'}`}
                          style={{ width: barWidth }}
                        />
                        <span className={`relative z-10 font-mono font-medium ${isFastest ? 'text-lime-600' : 'text-gray-600'}`}>
                          {formatPace(splitSecs)}
                        </span>
                      </div>
                    </div>
                    {isFastest && <div className="text-xs font-bold text-lime-600 bg-lime-50 px-2 py-1 rounded w-16 text-center">Fastest</div>}
                    {!isFastest && <div className="w-16"></div>}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
