import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const runsTable = pgTable("runs", {
  id: serial("id").primaryKey(),
  name: text("name"),
  type: text("type").notNull(), // Easy, Tempo, Long, Recovery, Interval
  distance: real("distance").notNull(), // km
  duration: integer("duration").notNull(), // seconds
  pace: real("pace").notNull(), // seconds per km
  calories: integer("calories"),
  elevation: integer("elevation"), // meters placeholder
  date: text("date").notNull(), // ISO datetime string
  route: text("route"), // JSON stringified [[lat,lng],...]
  splits: text("splits"), // JSON stringified [seconds_per_km, ...]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRunSchema = createInsertSchema(runsTable).omit({ id: true, createdAt: true });
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runsTable.$inferSelect;
