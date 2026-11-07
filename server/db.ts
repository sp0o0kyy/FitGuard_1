import { eq, desc, and, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  coachInviteCodes,
  coachTrainees,
  bodyMeasurements,
  workoutLogs,
  aiReports,
  type User,
  type InsertUser,
  type CoachInviteCode,
  type CoachTrainee,
  type BodyMeasurement,
  type WorkoutLog,
  type AiReport,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const url = process.env.DATABASE_URL || "mysql://fitguard:fitguard123@127.0.0.1:3306/fitguard";
  if (!_db && url) {
    try {
      _db = drizzle(url);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ================= USER QUERIES =================

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
  return rows[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0];
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export async function createUser(data: {
  username?: string;
  email?: string;
  passwordHash?: string;
  name: string;
  role: "coach" | "trainee" | "admin";
  phone?: string;
  heightCm?: number;
  currentWeight?: number | string;
  initialWeight?: number | string;
  targetWeight?: number | string;
}): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    username: data.username ? data.username.toLowerCase() : undefined,
    email: data.email ? data.email.toLowerCase() : undefined,
    passwordHash: data.passwordHash,
    name: data.name,
    role: data.role,
    phone: data.phone,
    heightCm: data.heightCm,
    currentWeight: data.currentWeight !== undefined ? String(data.currentWeight) : undefined,
    initialWeight: data.initialWeight !== undefined ? String(data.initialWeight) : undefined,
    targetWeight: data.targetWeight !== undefined ? String(data.targetWeight) : undefined,
    loginMethod: "credentials",
  });
  const insertId = (result as any)[0]?.insertId ?? Number((result as any).insertId);
  const created = await getUserById(insertId);
  if (!created) throw new Error("Failed to load created user");
  return created;
}

export async function updateUser(
  id: number,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    heightCm: number;
    initialWeight: number | string;
    currentWeight: number | string;
    targetWeight: number | string;
    notes: string;
    role: "coach" | "trainee" | "admin";
    lastSignedIn: Date;
  }>
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email ? data.email.toLowerCase() : null;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.heightCm !== undefined) updateData.heightCm = data.heightCm;
  if (data.initialWeight !== undefined) updateData.initialWeight = String(data.initialWeight);
  if (data.currentWeight !== undefined) updateData.currentWeight = String(data.currentWeight);
  if (data.targetWeight !== undefined) updateData.targetWeight = String(data.targetWeight);
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.lastSignedIn !== undefined) updateData.lastSignedIn = data.lastSignedIn;
  if (Object.keys(updateData).length === 0) return getUserById(id);
  await db.update(users).set(updateData).where(eq(users.id, id));
  return getUserById(id);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const v = user[field] ?? null;
      (values as any)[field] = v;
      updateSet[field] = v;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

// ================= COACH INVITE CODES =================

export async function createCoachInviteCode(coachId: number, options?: { maxUses?: number; expiresInDays?: number }): Promise<CoachInviteCode> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const code = `FP-${num}-${suffix}`;
  const expiresAt = options?.expiresInDays ? new Date(Date.now() + options.expiresInDays * 86400000) : null;
  const result = await db.insert(coachInviteCodes).values({
    coachId,
    code,
    maxUses: options?.maxUses ?? null,
    expiresAt,
  });
  const id = (result as any)[0]?.insertId ?? Number((result as any).insertId);
  const rows = await db.select().from(coachInviteCodes).where(eq(coachInviteCodes.id, id)).limit(1);
  return rows[0];
}

export async function findActiveInviteCode(code: string): Promise<CoachInviteCode | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(coachInviteCodes).where(eq(coachInviteCodes.code, code.trim().toUpperCase())).limit(1);
  const row = rows[0];
  if (!row) return undefined;
  if (!row.isActive) return undefined;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return undefined;
  if (row.maxUses && row.usesCount >= row.maxUses) return undefined;
  return row;
}

export async function listCoachInviteCodes(coachId: number): Promise<CoachInviteCode[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachInviteCodes).where(eq(coachInviteCodes.coachId, coachId)).orderBy(desc(coachInviteCodes.createdAt));
}

export async function deactivateInviteCode(coachId: number, codeId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(coachInviteCodes).set({ isActive: 0 }).where(and(eq(coachInviteCodes.id, codeId), eq(coachInviteCodes.coachId, coachId)));
}

// ================= COACH <-> TRAINEE LINKS =================

export async function linkCoachTrainee(params: { coachId: number; traineeId: number; inviteCode?: string }): Promise<CoachTrainee> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (params.coachId === params.traineeId) throw new Error("Coach and trainee cannot be the same user");
  const existing = await db
    .select()
    .from(coachTrainees)
    .where(and(eq(coachTrainees.coachId, params.coachId), eq(coachTrainees.traineeId, params.traineeId)))
    .limit(1);
  if (existing.length > 0) {
    if (existing[0].status !== "active") {
      await db.update(coachTrainees).set({ status: "active", linkedAt: new Date() }).where(eq(coachTrainees.id, existing[0].id));
      return { ...existing[0], status: "active" as const };
    }
    return existing[0];
  }
  const result = await db.insert(coachTrainees).values({
    coachId: params.coachId,
    traineeId: params.traineeId,
    status: "active",
    inviteCodeUsed: params.inviteCode ?? null,
  });
  if (params.inviteCode) {
    await db
      .update(coachInviteCodes)
      .set({ usesCount: sql`${coachInviteCodes.usesCount} + 1` })
      .where(eq(coachInviteCodes.code, params.inviteCode.trim().toUpperCase()));
  }
  const id = (result as any)[0]?.insertId ?? Number((result as any).insertId);
  const rows = await db.select().from(coachTrainees).where(eq(coachTrainees.id, id)).limit(1);
  return rows[0];
}

export async function getCoachTrainees(coachId: number) {
  const db = await getDb();
  if (!db) return [];
  const links = await db.select().from(coachTrainees).where(eq(coachTrainees.coachId, coachId)).orderBy(desc(coachTrainees.linkedAt));
  const results = [];
  for (const link of links) {
    const trainee = await getUserById(link.traineeId);
    if (!trainee) continue;
    const lastWorkout = await getLatestWorkout(link.traineeId);
    const lastAi = lastWorkout ? await getAiReportForWorkout(lastWorkout.id) : null;
    const measurements = await listMeasurements(link.traineeId, 1);
    const initialWeight = trainee.initialWeight ? Number(trainee.initialWeight) : null;
    const currentWeight = trainee.currentWeight ? Number(trainee.currentWeight) : measurements[0] ? Number(measurements[0].weight) : null;
    const weightDelta = initialWeight !== null && currentWeight !== null ? Number((currentWeight - initialWeight).toFixed(1)) : null;
    results.push({
      link,
      trainee,
      lastWorkout,
      lastAiReport: lastAi ?? null,
      latestMeasurement: measurements[0] ?? null,
      currentWeight,
      initialWeight,
      weightDelta,
    });
  }
  return results;
}

export async function getTraineeCoaches(traineeId: number) {
  const db = await getDb();
  if (!db) return [];
  const links = await db.select().from(coachTrainees).where(eq(coachTrainees.traineeId, traineeId)).orderBy(desc(coachTrainees.linkedAt));
  const results = [];
  for (const link of links) {
    const coach = await getUserById(link.coachId);
    if (coach) results.push({ link, coach });
  }
  return results;
}

export async function isCoachOfTrainee(coachId: number, traineeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(coachTrainees)
    .where(and(eq(coachTrainees.coachId, coachId), eq(coachTrainees.traineeId, traineeId)))
    .limit(1);
  return rows.length > 0;
}

export async function updateCoachNotes(coachId: number, traineeId: number, notes: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(coachTrainees).set({ coachNotes: notes }).where(and(eq(coachTrainees.coachId, coachId), eq(coachTrainees.traineeId, traineeId)));
}

export async function setTraineeStatus(coachId: number, traineeId: number, status: "active" | "paused" | "archived"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(coachTrainees).set({ status }).where(and(eq(coachTrainees.coachId, coachId), eq(coachTrainees.traineeId, traineeId)));
}

// ================= BODY MEASUREMENTS =================

export async function addMeasurement(data: {
  userId: number;
  measuredAt?: Date;
  weight: number;
  heightCm?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thigh?: number;
  bodyFat?: number;
  notes?: string;
}): Promise<BodyMeasurement> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bodyMeasurements).values({
    userId: data.userId,
    measuredAt: data.measuredAt ?? new Date(),
    weight: String(data.weight),
    heightCm: data.heightCm,
    chest: data.chest !== undefined ? String(data.chest) : undefined,
    waist: data.waist !== undefined ? String(data.waist) : undefined,
    hips: data.hips !== undefined ? String(data.hips) : undefined,
    biceps: data.biceps !== undefined ? String(data.biceps) : undefined,
    thigh: data.thigh !== undefined ? String(data.thigh) : undefined,
    bodyFat: data.bodyFat !== undefined ? String(data.bodyFat) : undefined,
    notes: data.notes,
  });
  // auto-update user current weight
  await db.update(users).set({ currentWeight: String(data.weight) }).where(eq(users.id, data.userId));
  const id = (result as any)[0]?.insertId ?? Number((result as any).insertId);
  const rows = await db.select().from(bodyMeasurements).where(eq(bodyMeasurements.id, id)).limit(1);
  return rows[0];
}

export async function listMeasurements(userId: number, limit = 50): Promise<BodyMeasurement[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, userId)).orderBy(desc(bodyMeasurements.measuredAt)).limit(limit);
}

export async function deleteMeasurement(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(bodyMeasurements).where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)));
}

// ================= WORKOUT LOGS =================

export type ExerciseSet = {
  set: number;
  weight: number;
  reps: number;
  isWarmup?: boolean;
};

export type Exercise = {
  name: string;
  category?: string;
  notes?: string;
  sets: ExerciseSet[];
};

export function calculateWorkoutTotals(exercises: Exercise[]) {
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  for (const ex of exercises) {
    for (const s of ex.sets || []) {
      totalSets += 1;
      totalReps += Number(s.reps) || 0;
      if (!s.isWarmup) {
        totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      }
    }
  }
  return {
    totalVolume: Number(totalVolume.toFixed(2)),
    totalSets,
    totalReps,
  };
}

export async function createWorkoutLog(data: {
  userId: number;
  workoutDate?: Date;
  title: string;
  wellness: number;
  sleepHours: number;
  heartRate?: number;
  bodyWeight?: number;
  notes?: string;
  energyLevel?: number;
  stressLevel?: number;
  durationMinutes?: number;
  exercises: Exercise[];
}): Promise<WorkoutLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const totals = calculateWorkoutTotals(data.exercises);
  const result = await db.insert(workoutLogs).values({
    userId: data.userId,
    workoutDate: data.workoutDate ?? new Date(),
    title: data.title,
    wellness: Math.max(1, Math.min(10, Math.round(data.wellness))),
    sleepHours: String(Math.max(0, Math.min(24, data.sleepHours))),
    heartRate: data.heartRate,
    bodyWeight: data.bodyWeight !== undefined ? String(data.bodyWeight) : undefined,
    notes: data.notes,
    energyLevel: data.energyLevel,
    stressLevel: data.stressLevel,
    durationMinutes: data.durationMinutes,
    exercises: JSON.stringify(data.exercises),
    totalVolume: String(totals.totalVolume),
    totalSets: totals.totalSets,
    totalReps: totals.totalReps,
  });
  const id = (result as any)[0]?.insertId ?? Number((result as any).insertId);
  const created = await getWorkoutLog(id);
  if (!created) throw new Error("Failed to load created workout log");
  return created;
}

export async function getWorkoutLog(id: number): Promise<WorkoutLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).limit(1);
  return rows[0];
}

export async function listWorkoutLogs(userId: number, limit = 60, options?: { fromDate?: Date }): Promise<WorkoutLog[]> {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(workoutLogs.userId, userId)];
  if (options?.fromDate) conds.push(gte(workoutLogs.workoutDate, options.fromDate));
  return db
    .select()
    .from(workoutLogs)
    .where(conds.length > 1 ? and(...conds) : conds[0])
    .orderBy(desc(workoutLogs.workoutDate))
    .limit(limit);
}

export async function getLatestWorkout(userId: number): Promise<WorkoutLog | undefined> {
  const logs = await listWorkoutLogs(userId, 1);
  return logs[0];
}

export async function deleteWorkoutLog(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiReports).where(eq(aiReports.workoutLogId, id));
  await db.delete(workoutLogs).where(and(eq(workoutLogs.id, id), eq(workoutLogs.userId, userId)));
}

// ================= AI REPORTS =================

export async function upsertAiReport(data: {
  workoutLogId: number;
  userId: number;
  summary: string;
  strengthProgressAnalysis: string;
  sleepWellnessCorrelation: string;
  anomaliesAndRisks: string;
  conclusions: string;
  recommendations: string;
  riskLevel: "low" | "medium" | "high";
  riskFlags: unknown[];
  progressPerExercise: Record<string, unknown>;
  modelUsed: string;
  generationMs?: number;
  rawResponse?: string;
}): Promise<AiReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = {
    workoutLogId: data.workoutLogId,
    userId: data.userId,
    summary: data.summary,
    strengthProgressAnalysis: data.strengthProgressAnalysis,
    sleepWellnessCorrelation: data.sleepWellnessCorrelation,
    anomaliesAndRisks: data.anomaliesAndRisks,
    conclusions: data.conclusions,
    recommendations: data.recommendations,
    riskLevel: data.riskLevel,
    riskFlags: JSON.stringify(data.riskFlags),
    progressPerExercise: JSON.stringify(data.progressPerExercise),
    modelUsed: data.modelUsed,
    generationMs: data.generationMs ?? 0,
    rawResponse: data.rawResponse ?? null,
  };
  await db.insert(aiReports).values(values).onDuplicateKeyUpdate({ set: values });
  const rows = await db.select().from(aiReports).where(eq(aiReports.workoutLogId, data.workoutLogId)).limit(1);
  return rows[0];
}

export async function getAiReportForWorkout(workoutLogId: number): Promise<AiReport | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(aiReports).where(eq(aiReports.workoutLogId, workoutLogId)).limit(1);
  return rows[0];
}

export async function listAiReportsForUser(userId: number, limit = 30): Promise<AiReport[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiReports).where(eq(aiReports.userId, userId)).orderBy(desc(aiReports.createdAt)).limit(limit);
}
