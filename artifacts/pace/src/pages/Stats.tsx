import { useState } from 'react';
import { useGetStatsHistory, useGetStatsSummary } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Clock, Zap, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

const ranges = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' }
] as const;

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatPace(secondsPerKm: number) {
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Stats() {
  const [range, setRange] = useState<typeof ranges[number]['value']>('30d');
  
  const { data: history, isLoading: historyLoading } = useGetStatsHistory({ range });
  const { data: summary, isLoading: summaryLoading } = useGetStatsSummary();

  // Mock changes for KPIs
  const isDistanceUp = true;
  const isTimeUp = true;
  const isPaceDown = true; // lower pace is better (faster)

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Statistics</h1>
        <p className="text-gray-500 mt-1">Track your performance over time.</p>
      </motion.div>

      {/* Range Selector */}
      <div className="flex bg-white rounded-full p-1 border shadow-sm w-fit">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              range === r.value 
                ? 'bg-black text-lime-400 shadow-md' 
                : 'text-gray-500 hover:text-black hover:bg-gray-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Total Distance" 
          value={summaryLoading ? null : `${summary?.thisWeek?.distance?.toFixed(1) || 0} km`} 
          icon={<Activity className="w-5 h-5 text-gray-400" />}
          change="+12.5%"
          isPositive={isDistanceUp}
          loading={summaryLoading}
        />
        <KPICard 
          title="Total Time" 
          value={summaryLoading ? null : formatDuration(summary?.thisWeek?.duration || 0)} 
          icon={<Clock className="w-5 h-5 text-gray-400" />}
          change="+5.2%"
          isPositive={isTimeUp}
          loading={summaryLoading}
        />
        <KPICard 
          title="Avg Pace" 
          value={summaryLoading ? null : `${formatPace((summary?.thisWeek?.duration || 0) / (summary?.thisWeek?.distance || 1))} /km`} 
          icon={<Zap className="w-5 h-5 text-gray-400" />}
          change="-0:15 /km"
          isPositive={isPaceDown} // negative change is positive for pace
          loading={summaryLoading}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Distance Over Time Chart */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
            <div className="mb-6">
              <h3 className="font-bold text-lg">Distance Over Time</h3>
            </div>
            
            {historyLoading ? (
              <Skeleton className="w-full h-[300px] rounded-xl" />
            ) : history?.points && history.points.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                      }}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                      formatter={(val: number) => [`${val.toFixed(1)} km`, 'Distance']}
                    />
                    <Area type="monotone" dataKey="distance" stroke="#CCFF00" strokeWidth={3} fillOpacity={1} fill="url(#colorDistance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed">
                <p className="text-gray-400 font-medium">No data for this period</p>
              </div>
            )}
          </Card>

          {/* Runs by Day of Week Chart */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
            <div className="mb-6">
              <h3 className="font-bold text-lg">Runs by Day</h3>
            </div>
            
            {historyLoading ? (
              <Skeleton className="w-full h-[250px] rounded-xl" />
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history?.runsPerDayOfWeek || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      allowDecimals={false}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [val, 'Runs']}
                    />
                    <Bar dataKey="count" fill="#111827" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* PRs Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-black text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-lime-400 text-black rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Personal Records</h3>
            </div>

            {summaryLoading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-16 bg-gray-800 rounded-xl" />
                <Skeleton className="w-full h-16 bg-gray-800 rounded-xl" />
                <Skeleton className="w-full h-16 bg-gray-800 rounded-xl" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 font-medium text-sm mb-1">Fastest 5K</p>
                  <p className="text-2xl font-black">{summary?.personalRecords?.fastest5k ? formatPace(summary.personalRecords.fastest5k) : '--'}</p>
                </div>
                <div className="h-px w-full bg-gray-800" />
                <div>
                  <p className="text-gray-400 font-medium text-sm mb-1">Fastest 10K</p>
                  <p className="text-2xl font-black">{summary?.personalRecords?.fastest10k ? formatPace(summary.personalRecords.fastest10k) : '--'}</p>
                </div>
                <div className="h-px w-full bg-gray-800" />
                <div>
                  <p className="text-gray-400 font-medium text-sm mb-1">Longest Run</p>
                  <p className="text-2xl font-black">{summary?.personalRecords?.longestRun ? `${summary.personalRecords.longestRun.toFixed(1)} km` : '--'}</p>
                </div>
                <div className="h-px w-full bg-gray-800" />
                <div>
                  <p className="text-gray-400 font-medium text-sm mb-1">Longest Duration</p>
                  <p className="text-2xl font-black">{summary?.personalRecords?.longestDuration ? formatDuration(summary.personalRecords.longestDuration) : '--'}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, change, isPositive, loading }: any) {
  return (
    <Card className="border-0 shadow-sm rounded-3xl p-5 bg-white relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-gray-500 font-medium text-sm">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1 rounded-lg" />
        ) : (
          <p className="text-3xl font-black tracking-tight mt-1">{value || '--'}</p>
        )}
      </div>
    </Card>
  );
}
