import { useState, useEffect } from 'react';
import { useGetStatsSummary } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LogOut, Settings, Award, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { data: stats } = useGetStatsSummary();
  const [goal, setGoal] = useState("4");
  const [metric, setMetric] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const savedGoal = localStorage.getItem('pace_weekly_goal');
    if (savedGoal) setGoal(savedGoal);
    
    const savedUnit = localStorage.getItem('pace_unit_metric');
    if (savedUnit !== null) setMetric(savedUnit === 'true');
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('pace_weekly_goal', goal);
  }, [goal]);

  useEffect(() => {
    localStorage.setItem('pace_unit_metric', String(metric));
  }, [metric]);

  const allTimeHours = stats?.allTime?.duration ? Math.floor(stats.allTime.duration / 3600) : 0;

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 sm:px-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center py-8">
        <Avatar className="w-24 h-24 border-4 border-lime-400 mb-4 shadow-lg">
          <AvatarFallback className="bg-black text-lime-400 font-black text-2xl">AM</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Alex Morgan</h1>
        <p className="text-gray-500 font-medium mt-1 flex items-center gap-1">
          <Award className="w-4 h-4 text-lime-500" />
          Pace Member since 2024
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* All Time Stats */}
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-black text-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="text-lime-400 w-5 h-5" /> All-Time Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-gray-400 font-medium text-sm mb-1">Total Distance</p>
                <p className="text-3xl font-black text-lime-400">{stats?.allTime?.distance?.toFixed(0) || 0} <span className="text-lg font-bold text-gray-500">km</span></p>
              </div>
              <div>
                <p className="text-gray-400 font-medium text-sm mb-1">Total Runs</p>
                <p className="text-3xl font-black text-lime-400">{stats?.allTime?.runs || 0}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 font-medium text-sm mb-1">Time on feet</p>
                <p className="text-3xl font-black text-white">{allTimeHours} <span className="text-lg font-bold text-gray-500">hours</span></p>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Card */}
          <Card className="border border-lime-200 shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-lime-50 to-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Sparkles className="w-24 h-24 text-lime-600" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-2 text-lime-700 font-black tracking-widest uppercase text-sm">
                <Sparkles className="w-4 h-4" /> Pace Pro
              </div>
              <h3 className="text-2xl font-black text-black mb-2 leading-tight">Unlock advanced<br/>analytics & plans.</h3>
              <p className="text-gray-600 font-medium text-sm mb-6 max-w-[200px]">Get custom training schedules and deeper insights.</p>
              <Button className="bg-black text-lime-400 hover:bg-gray-800 rounded-full font-bold px-6 shadow-md">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" /> Settings
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="goal" className="font-bold text-gray-700">Weekly Run Goal</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="goal" 
                    type="number" 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-24 rounded-xl text-center font-black text-lg bg-gray-50 border-0" 
                    min="1" 
                    max="14"
                  />
                  <span className="font-bold text-gray-500">runs per week</span>
                </div>
                <p className="text-xs font-medium text-gray-400">Updates your progress bar on the Home dashboard.</p>
              </div>

              <Separator className="bg-gray-100" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-bold text-gray-700 text-base">Units</Label>
                  <p className="text-sm font-medium text-gray-500">Metric (km) or Imperial (mi)</p>
                </div>
                <div className="flex items-center gap-2 font-bold text-sm bg-gray-50 p-1 rounded-full border border-gray-100">
                  <button 
                    onClick={() => setMetric(false)}
                    className={`px-3 py-1 rounded-full transition-colors ${!metric ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                  >
                    mi
                  </button>
                  <button 
                    onClick={() => setMetric(true)}
                    className={`px-3 py-1 rounded-full transition-colors ${metric ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                  >
                    km
                  </button>
                </div>
              </div>

              <Separator className="bg-gray-100" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-bold text-gray-700 text-base">Notifications</Label>
                  <p className="text-sm font-medium text-gray-500">Workout reminders</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator className="bg-gray-100" />

              <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-xl h-12">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
