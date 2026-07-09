import { Router } from "express";
import { db, runsTable } from "@workspace/db";
import { desc, gte, sql } from "drizzle-orm";
import { GetStatsHistoryQueryParams } from "@workspace/api-zod";

const router = Router();

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as start of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// GET /stats/summary
router.get("/summary", async (req, res) => {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = addDays(weekStart, -7);
  const lastWeekEnd = weekStart;

  const allRuns = await db.select().from(runsTable).orderBy(desc(runsTable.date));

  const thisWeekRuns = allRuns.filter(r => new Date(r.date) >= weekStart);
  const lastWeekRuns = allRuns.filter(r => {
    const d = new Date(r.date);
    return d >= lastWeekStart && d < lastWeekEnd;
  });

  function weekStats(runs: typeof allRuns) {
    return {
      distance: runs.reduce((s, r) => s + r.distance, 0),
      duration: runs.reduce((s, r) => s + r.duration, 0),
      runs: runs.length,
      elevation: runs.reduce((s, r) => s + (r.elevation ?? 0), 0),
    };
  }

  const allTime = {
    distance: allRuns.reduce((s, r) => s + r.distance, 0),
    duration: allRuns.reduce((s, r) => s + r.duration, 0),
    runs: allRuns.length,
  };

  const goal = 4;
  const completed = thisWeekRuns.length;
  const percentage = Math.min(100, Math.round((completed / goal) * 100));

  // Personal records
  const runs5k = allRuns.filter(r => r.distance >= 4.9 && r.distance <= 5.1);
  const runs10k = allRuns.filter(r => r.distance >= 9.8 && r.distance <= 10.2);

  const fastest5k = runs5k.length > 0 ? Math.min(...runs5k.map(r => r.pace)) : null;
  const fastest10k = runs10k.length > 0 ? Math.min(...runs10k.map(r => r.pace)) : null;
  const longestRun = allRuns.length > 0 ? Math.max(...allRuns.map(r => r.distance)) : null;
  const longestDuration = allRuns.length > 0 ? Math.max(...allRuns.map(r => r.duration)) : null;

  // Weekly run days — Mon through Sun of current week
  const weeklyRunDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayStr = formatDate(day);
    const today = formatDate(now);
    const hasRun = thisWeekRuns.some(r => r.date.startsWith(dayStr));
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    return {
      date: dayStr,
      dayLabel: labels[i],
      hasRun,
      isToday: dayStr === today,
    };
  });

  res.json({
    thisWeek: weekStats(thisWeekRuns),
    lastWeek: weekStats(lastWeekRuns),
    allTime,
    weekProgress: { completed, goal, percentage },
    personalRecords: { fastest5k, fastest10k, longestRun, longestDuration },
    weeklyRunDays,
  });
});

// GET /stats/history
router.get("/history", async (req, res) => {
  const parsed = GetStatsHistoryQueryParams.safeParse(req.query);
  const range = parsed.success ? (parsed.data.range ?? "30d") : "30d";

  const now = new Date();
  let since: Date | null = null;
  switch (range) {
    case "7d": since = addDays(now, -7); break;
    case "30d": since = addDays(now, -30); break;
    case "3m": since = addDays(now, -90); break;
    case "6m": since = addDays(now, -180); break;
    case "1y": since = addDays(now, -365); break;
    case "all": since = null; break;
  }

  const allRuns = await db.select().from(runsTable).orderBy(desc(runsTable.date));
  const filtered = since ? allRuns.filter(r => new Date(r.date) >= since!) : allRuns;

  // Group by date
  const byDate = new Map<string, { distance: number; runs: number }>();
  for (const run of filtered) {
    const d = run.date.split("T")[0];
    const existing = byDate.get(d) ?? { distance: 0, runs: 0 };
    byDate.set(d, { distance: existing.distance + run.distance, runs: existing.runs + 1 });
  }

  const points = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { distance, runs }]) => ({ date, distance: Math.round(distance * 10) / 10, runs }));

  // Runs per day of week
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayCounts = new Array(7).fill(0);
  for (const run of filtered) {
    const d = new Date(run.date);
    let day = d.getDay(); // 0=Sun, 1=Mon...
    day = day === 0 ? 6 : day - 1; // shift to Mon=0
    dayCounts[day]++;
  }
  const runsPerDayOfWeek = dayNames.map((day, i) => ({ day, count: dayCounts[i] }));

  res.json({ points, runsPerDayOfWeek });
});

export default router;
