import { Router } from "express";
import { db, runsTable } from "@workspace/db";
import { eq, desc, like, or } from "drizzle-orm";
import {
  CreateRunBody,
  UpdateRunBody,
  GetRunParams,
  UpdateRunParams,
  DeleteRunParams,
  ListRunsQueryParams,
  GetRecentRunsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// GET /runs
router.get("/", async (req, res) => {
  const parsed = ListRunsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { search, limit = 100, offset = 0 } = parsed.data;

  if (search) {
    const runs = await db
      .select()
      .from(runsTable)
      .where(
        or(
          like(runsTable.name, `%${search}%`),
          like(runsTable.type, `%${search}%`)
        )
      )
      .orderBy(desc(runsTable.date))
      .limit(limit)
      .offset(offset);
    res.json(runs.map(formatRun));
    return;
  }

  const runs = await db
    .select()
    .from(runsTable)
    .orderBy(desc(runsTable.date))
    .limit(limit)
    .offset(offset);
  res.json(runs.map(formatRun));
});

// GET /runs/recent — must come BEFORE /runs/:id
router.get("/recent", async (req, res) => {
  const parsed = GetRecentRunsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;
  const runs = await db
    .select()
    .from(runsTable)
    .orderBy(desc(runsTable.date))
    .limit(limit);
  res.json(runs.map(formatRun));
});

// POST /runs
router.post("/", async (req, res) => {
  const parsed = CreateRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const data = parsed.data;
  const distance = data.distance;
  const duration = data.duration;

  if (distance <= 0 || duration <= 0) {
    res.status(400).json({ error: "distance and duration must be positive" });
    return;
  }

  const pace = duration / distance;

  const [run] = await db
    .insert(runsTable)
    .values({
      name: data.name ?? null,
      type: data.type,
      distance,
      duration,
      pace,
      calories: data.calories ?? null,
      elevation: data.elevation ?? null,
      date: data.date,
      route: data.route ?? null,
      splits: data.splits ?? null,
    })
    .returning();

  res.status(201).json(formatRun(run));
});

// GET /runs/:id
router.get("/:id", async (req, res) => {
  const parsed = GetRunParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [run] = await db
    .select()
    .from(runsTable)
    .where(eq(runsTable.id, parsed.data.id));
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json(formatRun(run));
});

// PATCH /runs/:id
router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateRunParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateRunBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const body = bodyParsed.data;

  // Reject empty patch
  if (Object.keys(body).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  // Build a strongly-typed update object for Drizzle
  type RunUpdate = Partial<typeof runsTable.$inferInsert>;
  const updateValues: RunUpdate = {};

  if (body.name !== undefined) updateValues.name = body.name;
  if (body.type !== undefined) updateValues.type = body.type;
  if (body.date !== undefined) updateValues.date = body.date;
  if (body.calories !== undefined) updateValues.calories = body.calories;
  if (body.elevation !== undefined) updateValues.elevation = body.elevation;
  if (body.route !== undefined) updateValues.route = body.route;
  if (body.splits !== undefined) updateValues.splits = body.splits;

  // Recompute pace if distance or duration changed
  if (body.distance !== undefined || body.duration !== undefined) {
    const [existing] = await db
      .select()
      .from(runsTable)
      .where(eq(runsTable.id, paramsParsed.data.id));
    if (!existing) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    const newDistance = body.distance ?? existing.distance;
    const newDuration = body.duration ?? existing.duration;
    if (newDistance <= 0 || newDuration <= 0) {
      res.status(400).json({ error: "distance and duration must be positive" });
      return;
    }
    if (body.distance !== undefined) updateValues.distance = body.distance;
    if (body.duration !== undefined) updateValues.duration = body.duration;
    updateValues.pace = newDuration / newDistance;
  }

  const [run] = await db
    .update(runsTable)
    .set(updateValues)
    .where(eq(runsTable.id, paramsParsed.data.id))
    .returning();

  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.json(formatRun(run));
});

// DELETE /runs/:id
router.delete("/:id", async (req, res) => {
  const parsed = DeleteRunParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const result = await db
    .delete(runsTable)
    .where(eq(runsTable.id, parsed.data.id))
    .returning();
  if (!result.length) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  res.status(204).send();
});

function formatRun(run: typeof runsTable.$inferSelect) {
  return {
    ...run,
    createdAt: run.createdAt.toISOString(),
  };
}

export default router;
