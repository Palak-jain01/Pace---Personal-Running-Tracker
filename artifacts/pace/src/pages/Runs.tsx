import { useListRuns, useDeleteRun, getListRunsQueryKey, getGetStatsSummaryQueryKey, getGetRecentRunsQueryKey } from '@workspace/api-client-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';

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

export default function Runs() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const { data: runs, isLoading } = useListRuns(
    { search: debouncedSearch || undefined },
    {}
  );

  const deleteRun = useDeleteRun();
  const queryClient = useQueryClient();

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this run?")) {
      deleteRun.mutate({ id }, {
        onSuccess: () => {
          toast.success("Run deleted");
          queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        }
      });
    }
  };

  // Group by month
  const groupedRuns = runs?.reduce((acc, run) => {
    const month = format(parseISO(run.date), 'MMMM yyyy');
    if (!acc[month]) acc[month] = [];
    acc[month].push(run);
    return acc;
  }, {} as Record<string, typeof runs>) || {};

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Runs</h1>
          <p className="text-gray-500 mt-1">Your complete training history.</p>
        </motion.div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input 
            placeholder="Search runs..." 
            className="pl-9 bg-white border-0 shadow-sm rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white" />
          ))}
        </div>
      ) : runs?.length === 0 ? (
        <Card className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold mb-1">No runs found</h3>
          <p className="text-gray-500">Try adjusting your search terms.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRuns).map(([month, monthRuns]) => (
            <div key={month} className="space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider sticky top-16 bg-[#FAFAFA] py-2 z-10 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> {month}
              </h2>
              <div className="space-y-3">
                {monthRuns.map((run, i) => (
                  <motion.div 
                    key={run.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/runs/${run.id}`} className="block group">
                      <Card className="border-0 shadow-sm rounded-2xl p-4 bg-white hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${runTypeColor[run.type as keyof typeof runTypeColor]}`}>
                            {run.type[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-base">{run.name || `${run.type} Run`}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${runTypeColor[run.type as keyof typeof runTypeColor]}`}>
                                {run.type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                              <span>{format(parseISO(run.date), 'MMM d, h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-64 pl-16 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <p className="font-black text-lg tracking-tight">{run.distance.toFixed(1)} <span className="text-xs text-gray-500 font-medium">km</span></p>
                            <p className="text-xs text-gray-500 font-medium">{formatPace(run.pace)} • {formatDuration(run.duration)}</p>
                          </div>
                          <button 
                            onClick={(e) => handleDelete(run.id, e)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
