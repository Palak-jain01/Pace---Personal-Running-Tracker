import { useState, useRef, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRun, getListRunsQueryKey, getGetRecentRunsQueryKey, getGetStatsSummaryQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function LogRunDialog({ children, open, onOpenChange }: { children?: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) onOpenChange(newOpen);
  };

  const controlledOpen = open !== undefined ? open : isOpen;

  const [type, setType] = useState<"Easy" | "Tempo" | "Long" | "Recovery" | "Interval">("Easy");
  const [distance, setDistance] = useState("");
  const [durationStr, setDurationStr] = useState(""); // mm:ss
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [name, setName] = useState("");

  const createRun = useCreateRun();
  const createFnRef = useRef(createRun.mutate);
  createFnRef.current = createRun.mutate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse duration (mm:ss to seconds)
    let durationSeconds = 0;
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      durationSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      durationSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else {
      durationSeconds = parseInt(durationStr) * 60; // assume minutes if no colon
    }

    if (!durationSeconds || isNaN(durationSeconds)) {
      toast.error("Invalid duration format. Use MM:SS");
      return;
    }

    const distNum = parseFloat(distance);
    if (!distNum || isNaN(distNum)) {
      toast.error("Invalid distance");
      return;
    }

    const dateTime = new Date(`${date}T${time}:00`).toISOString();

    createFnRef.current(
      {
        data: {
          type,
          distance: distNum,
          duration: durationSeconds,
          date: dateTime,
          name: name || undefined,
        }
      },
      {
        onSuccess: () => {
          toast.success("Run logged! 🏃");
          handleOpenChange(false);
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentRunsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          
          // Reset form
          setDistance("");
          setDurationStr("");
          setName("");
          setType("Easy");
        },
        onError: () => {
          toast.error("Failed to log run");
        }
      }
    );
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-8 md:px-0 md:pb-0 pt-4">
      <div className="space-y-2">
        <Label>Run Type</Label>
        <div className="flex flex-wrap gap-2">
          {["Easy", "Tempo", "Long", "Recovery", "Interval"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                type === t 
                  ? 'bg-black text-lime-400' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance">Distance (km)</Label>
          <Input 
            id="distance" 
            type="number" 
            step="0.01" 
            placeholder="5.0" 
            required 
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (MM:SS)</Label>
          <Input 
            id="duration" 
            placeholder="30:00" 
            required 
            value={durationStr}
            onChange={(e) => setDurationStr(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date" 
            type="date" 
            required 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input 
            id="time" 
            type="time" 
            required 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name (Optional)</Label>
        <Input 
          id="name" 
          placeholder="Morning miles" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <Button type="submit" className="w-full bg-lime-400 text-black hover:bg-lime-500 font-bold rounded-xl mt-6 py-6" disabled={createRun.isPending}>
        {createRun.isPending ? "Saving..." : "Save Run"}
      </Button>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={controlledOpen} onOpenChange={handleOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Log a Run</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={controlledOpen} onOpenChange={handleOpenChange}>
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl font-bold">Log a Run</DrawerTitle>
        </DrawerHeader>
        {formContent}
      </DrawerContent>
    </Drawer>
  );
}
