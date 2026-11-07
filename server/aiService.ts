import axios from "axios";
import { ENV } from "./_core/env";
import {
  getWorkoutLog,
  listWorkoutLogs,
  getUserById,
  upsertAiReport,
  type Exercise,
} from "./db";
import type { WorkoutLog, User } from "../drizzle/schema";

// ================= TYPES =================

export type RiskSeverity = "low" | "medium" | "high";

export type RiskFlag = {
  code: string;
  title: string;
  severity: RiskSeverity;
  description: string;
};

export type ExerciseDelta = {
  exercise: string;
  currentMax: number;
  prevMax: number | null;
  deltaKg: number | null;
  deltaPercent: number | null;
  trend: "up" | "down" | "same" | "new";
  isPR: boolean;
};

export type StructuredReport = {
  summary: string;
  strengthProgressAnalysis: string;
  sleepWellnessCorrelation: string;
  anomaliesAndRisks: string;
  conclusions: string;
  recommendations: string;
  riskLevel: RiskSeverity;
  riskFlags: RiskFlag[];
  progressPerExercise: Record<string, ExerciseDelta>;
  modelUsed: string;
  generationMs: number;
};

// ================= HELPERS =================

function safeParseExercises(raw: string): Exercise[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function exerciseMaxWeight(exercise: Exercise): number {
  let m = 0;
  for (const s of exercise.sets || []) {
    if (!s.isWarmup && typeof s.weight === "number" && s.weight > m) m = s.weight;
  }
  return m;
}

function normalizeExName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// ================= DETERMINISTIC ENGINE =================

export function computeExerciseDeltas(
  current: WorkoutLog,
  previous: WorkoutLog[]
): Record<string, ExerciseDelta> {
  const currentExercises = safeParseExercises(current.exercises);
  const deltas: Record<string, ExerciseDelta> = {};

  for (const ex of currentExercises) {
    const key = ex.name.trim();
    if (!key) continue;
    const curMax = exerciseMaxWeight(ex);

    let prevMax: number | null = null;
    let allTimeMax = 0;

    for (const prev of previous) {
      const prevExs = safeParseExercises(prev.exercises);
      for (const p of prevExs) {
        if (normalizeExName(p.name) === normalizeExName(ex.name)) {
          const pm = exerciseMaxWeight(p);
          if (prevMax === null) prevMax = pm; // most recent
          if (pm > allTimeMax) allTimeMax = pm;
        }
      }
    }

    if (prevMax === null) {
      deltas[key] = {
        exercise: key,
        currentMax: curMax,
        prevMax: null,
        deltaKg: null,
        deltaPercent: null,
        trend: "new",
        isPR: true,
      };
    } else {
      const deltaKg = Number((curMax - prevMax).toFixed(2));
      const deltaPercent = prevMax > 0 ? Number(((deltaKg / prevMax) * 100).toFixed(1)) : 0;
      let trend: ExerciseDelta["trend"] = "same";
      if (deltaKg > 0) trend = "up";
      else if (deltaKg < 0) trend = "down";
      deltas[key] = {
        exercise: key,
        currentMax: curMax,
        prevMax,
        deltaKg,
        deltaPercent,
        trend,
        isPR: curMax > allTimeMax,
      };
    }
  }
  return deltas;
}

const PAIN_PATTERNS = [
  /\bболит\b/i,
  /\bболь\b/i,
  /\bтянет\b/i,
  /\bломит\b/i,
  /\bноет\b/i,
  /\bколен/i,
  /\bплеч/i,
  /\bспин\b/i,
  /\bпоясниц/i,
  /\bлокот\b/i,
  /\bсухожил/i,
  /\bтравм/i,
  /\bдискомфорт/i,
  /\bспазм/i,
  /\bзажало\b/i,
  /\bхруст/i,
  /\bвоспал/i,
  /\bне мог(?:у|ли) жать\b/i,
  /\bпрострел/i,
];

export function detectRiskFlags(
  current: WorkoutLog,
  previous: WorkoutLog[]
): { flags: RiskFlag[]; level: RiskSeverity } {
  const flags: RiskFlag[] = [];
  const sleep = Number(current.sleepHours) || 0;
  const wellness = current.wellness;
  const curVolume = Number(current.totalVolume) || 0;

  // 1. Sleep deficit
  if (sleep > 0 && sleep < 6) {
    flags.push({
      code: "SLEEP_DEFICIT",
      title: "Недосып перед тренировкой",
      severity: sleep < 5 ? "high" : "medium",
      description: `Ученик спал всего ${sleep} ч. Хронический недосып снижает восстановление и концентрацию.`,
    });
  }

  // 2. Pain complaints in notes
  if (current.notes) {
    const hits = PAIN_PATTERNS.filter((p) => p.test(current.notes!));
    if (hits.length > 0) {
      flags.push({
        code: "PAIN_COMPLAINT",
        title: "Жалоба на боль или дискомфорт в заметках",
        severity: "high",
        description: `В заметках зафиксированы симптомы: «${current.notes.slice(0, 160)}». Рекомендуется уточнить локализацию и снизить осевую нагрузку.`,
      });
    }
  }

  // 3. Low wellness
  if (wellness <= 4) {
    flags.push({
      code: "LOW_WELLNESS",
      title: "Низкое субъективное самочувствие",
      severity: wellness <= 3 ? "high" : "medium",
      description: `Самочувствие оценено на ${wellness}/10. Возможен накопленный стресс, недовосстановление или начало болезни.`,
    });
  }

  // 4. Volume / strength drop vs recent average
  if (previous.length >= 1) {
    const recentVolumes = previous.slice(0, 3).map((p) => Number(p.totalVolume) || 0).filter((v) => v > 0);
    if (recentVolumes.length > 0) {
      const avgVol = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
      if (avgVol > 0 && curVolume > 0 && curVolume < avgVol * 0.85) {
        const dropPct = Math.round((1 - curVolume / avgVol) * 100);
        flags.push({
          code: "VOLUME_DROP",
          title: "Снижение тренировочного тоннажа",
          severity: dropPct >= 25 ? "high" : "medium",
          description: `Общий объём (${Math.round(curVolume)} кг) на ${dropPct}% ниже среднего за последние 3 тренировки (${Math.round(avgVol)} кг).`,
        });
      }
    }
  }

  // 5. Sleep-performance link
  if (sleep > 0 && sleep < 6 && flags.some((f) => f.code === "VOLUME_DROP" || f.code === "LOW_WELLNESS")) {
    flags.push({
      code: "SLEEP_PERFORMANCE_DROP",
      title: "Связка: недосып → просадка результатов",
      severity: "medium",
      description: `При ${sleep} ч сна зафиксировано падение показателей. Типичный маркер недовосстановления ЦНС.`,
    });
  }

  // 6. Elevated resting HR
  if (current.heartRate && current.heartRate >= 95) {
    flags.push({
      code: "ELEVATED_HR",
      title: "Повышенный пульс",
      severity: "medium",
      description: `Зафиксирован пульс ${current.heartRate} уд/мин — возможна реакция на усталость, кофеин, жару или стресс.`,
    });
  }

  // 7. Overtraining pattern: wellness <= 5 three times in a row
  if (previous.length >= 2) {
    const chain = [current, ...previous.slice(0, 2)];
    if (chain.every((l) => l.wellness <= 5)) {
      flags.push({
        code: "OVERTRAINING_RISK",
        title: "Признаки перетренированности (хроническое недовосстановление)",
        severity: "high",
        description: `Самочувствие ≤ 5 три тренировки подряд. Настоятельно рекомендуется разгрузочная неделя (deload).`,
      });
    }
  }

  let level: RiskSeverity = "low";
  if (flags.some((f) => f.severity === "high")) level = "high";
  else if (flags.some((f) => f.severity === "medium")) level = "medium";

  return { flags, level };
}

export function buildDeterministicReport(
  trainee: User,
  current: WorkoutLog,
  previous: WorkoutLog[]
): StructuredReport {
  const started = Date.now();
  const sleep = Number(current.sleepHours) || 0;
  const volume = Math.round(Number(current.totalVolume) || 0);
  const deltas = computeExerciseDeltas(current, previous);
  const { flags, level } = detectRiskFlags(current, previous);
  const deltaEntries = Object.values(deltas);

  const upList = deltaEntries.filter((d) => d.trend === "up");
  const downList = deltaEntries.filter((d) => d.trend === "down");
  const newPRs = deltaEntries.filter((d) => d.isPR && d.currentMax > 0);

  // ---------- Summary ----------
  const summary =
    `Ученик ${trainee.name || "подопечный"} провёл тренировку «${current.title}». ` +
    `Самочувствие: ${current.wellness}/10, сон: ${sleep} ч, выполнен объём ${volume.toLocaleString("ru-RU")} кг ` +
    `в ${current.totalSets} подходах (${current.totalReps} повторений)` +
    (current.bodyWeight ? `, текущий вес тела ${current.bodyWeight} кг` : "") +
    (current.durationMinutes ? `, длительность ~${current.durationMinutes} мин` : "") +
    `.`;

  // ---------- Strength progress ----------
  const strengthLines: string[] = [];
  if (deltaEntries.length === 0) {
    strengthLines.push("В этой тренировке упражнения не были детально зафиксированы.");
  } else {
    for (const d of deltaEntries) {
      if (d.trend === "new") {
        strengthLines.push(`• **${d.exercise}**: рабочий максимум ${d.currentMax} кг — первое зафиксированное выполнение упражнения.`);
      } else if (d.trend === "up") {
        strengthLines.push(
          `• **${d.exercise}**: ${d.currentMax} кг (+${d.deltaKg} кг, +${d.deltaPercent}% к прошлому разу)` +
            (d.isPR ? " — новый личный рекорд" : "") + "."
        );
      } else if (d.trend === "down") {
        strengthLines.push(`• **${d.exercise}**: ${d.currentMax} кг (${d.deltaKg} кг, ${d.deltaPercent}% к прошлому разу).`);
      } else {
        strengthLines.push(`• **${d.exercise}**: ${d.currentMax} кг (на уровне прошлой тренировки).`);
      }
    }
  }
  const strengthProgressAnalysis = strengthLines.join("\n");

  // ---------- Sleep & wellness correlation ----------
  let sleepWellnessCorrelation = "";
  if (previous.length === 0) {
    sleepWellnessCorrelation =
      `Это первая зафиксированная тренировка. Сон ${sleep} ч при самочувствии ${current.wellness}/10. ` +
      `Для построения надёжных корреляций требуется история минимум из 3–5 тренировок.`;
  } else {
    const avgPrevSleep =
      previous.slice(0, 5).reduce((a, b) => a + (Number(b.sleepHours) || 0), 0) /
      Math.min(5, previous.length);
    const avgPrevWell =
      previous.slice(0, 5).reduce((a, b) => a + b.wellness, 0) / Math.min(5, previous.length);

    if (sleep < 6 && current.wellness <= 5) {
      sleepWellnessCorrelation =
        `Прямая зависимость: сон ${sleep} ч (средний по профилю ~${avgPrevSleep.toFixed(1)} ч) ` +
        `сопровождается сниженным самочувствием ${current.wellness}/10 ` +
        `и общим падением эффективности. Недостаток фазы медленного сна ухудшает мышечное восстановление.`;
    } else if (sleep >= 7.5 && current.wellness >= 7) {
      sleepWellnessCorrelation =
        `Полноценный сон ${sleep} ч отлично соотносится с высоким самочувствием ${current.wellness}/10 ` +
        `и уверенной динамикой рабочих весов. Такой режим сна рекомендуется закрепить как базовый.`;
    } else {
      sleepWellnessCorrelation =
        `Сон ${sleep} ч и самочувствие ${current.wellness}/10 находятся в умеренно-стабильном диапазоне ` +
        `(среднее самочувствие по истории ~${avgPrevWell.toFixed(1)}/10). Резких отклонений от базового профиля не выявлено.`;
    }
  }

  // ---------- Anomalies & risks ----------
  let anomaliesAndRisks = "";
  if (flags.length === 0) {
    anomaliesAndRisks = "Критических отклонений и признаков перетренированности не выявлено. Динамика показателей в пределах нормы.";
  } else {
    anomaliesAndRisks = flags
      .map((f) => `• [${f.severity.toUpperCase()}] **${f.title}**: ${f.description}`)
      .join("\n");
  }

  // ---------- Conclusions ----------
  const concl: string[] = [];
  if (newPRs.length > 0) concl.push(`Зафиксирован(ы) новый(е) рекорд(ы): ${newPRs.map((d) => `${d.exercise} ${d.currentMax} кг`).join(", ")}.`);
  if (upList.length > 0) concl.push(`Положительная динамика рабочих весов в ${upList.length} упражнениях.`);
  if (downList.length > 0) concl.push(`Снижение весов в упражнениях: ${downList.map((d) => d.exercise).join(", ")}.`);
  if (sleep < 6) concl.push(`Дефицит сна (${sleep} ч) выступает главным фактором, сдерживающим результат.`);
  if (flags.some((f) => f.code === "PAIN_COMPLAINT")) concl.push(`Внимание: ученик отметил болевые ощущения в заметках — требуется контакт тренера.`);
  if (concl.length === 0) concl.push("Тренировка выполнена в плановом режиме, динамика силовых стабильная.");
  const conclusions = concl.map((c) => `• ${c}`).join("\n");

  // ---------- Recommendations ----------
  const recs: string[] = [];
  if (flags.some((f) => f.code === "PAIN_COMPLAINT")) {
    recs.push("Связаться с учеником и уточнить характер боли; при необходимости убрать упражнения с осевой/ротационной нагрузкой на болезненную зону.");
  }
  if (sleep < 6) {
    recs.push("Обсудить режим сна и гигиену отхода ко сну; при регулярном недосыпе сдвинуть тяжёлые тренировки на более восстановительные дни.");
  }
  if (flags.some((f) => f.code === "OVERTRAINING_RISK")) {
    recs.push("Назначить разгрузочную неделю: снизить тоннаж на 40–50% и рабочий вес на 10–15% при сохранении техники.");
  }
  if (downList.length > 0 && sleep >= 7) {
    recs.push("При нормальном сне и падении весов проверить питание (дефицит калорий), стресс вне зала или пересмотреть объём в конкретном движении.");
  }
  if (upList.length > 0 && level === "low") {
    recs.push("Продолжить прогрессивную перегрузку: можно планировать прибавку 2.5–5% к рабочим весам в следующем микроцикле.");
  }
  if (recs.length === 0) recs.push("Сохранять текущую программу и отслеживать динамику ещё 1–2 тренировки.");
  const recommendations = recs.map((r) => `• ${r}`).join("\n");

  return {
    summary,
    strengthProgressAnalysis,
    sleepWellnessCorrelation,
    anomaliesAndRisks,
    conclusions,
    recommendations,
    riskLevel: level,
    riskFlags: flags,
    progressPerExercise: deltas,
    modelUsed: "deterministic-engine",
    generationMs: Date.now() - started,
  };
}

// ================= LLM ENRICHMENT =================

interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  provider: string;
}

function resolveLLMConfig(): LLMConfig | null {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const apiKey = (process.env.AI_API_KEY || "").trim();
  const base = (process.env.AI_API_BASE || "").trim().replace(/\/$/, "");
  const modelOverride = (process.env.AI_MODEL || "").trim();

  if (provider === "groq") {
    const key = apiKey || (process.env.GROQ_API_KEY || "").trim();
    if (!key) return null;
    return {
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: key,
      model: modelOverride || "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }

  if (provider === "openrouter") {
    const key = apiKey || (process.env.OPENROUTER_API_KEY || "").trim();
    if (!key) return null;
    return {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: key,
      model: modelOverride || "meta-llama/llama-3.3-70b-instruct:free",
      provider: "openrouter",
    };
  }

  if (provider === "gemini") {
    const key = apiKey || (process.env.GEMINI_API_KEY || "").trim();
    if (!key) return null;
    return {
      endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: key,
      model: modelOverride || "gemini-2.5-flash",
      provider: "gemini",
    };
  }

  if (provider === "ollama") {
    return {
      endpoint: `${base || "http://localhost:11434"}/v1/chat/completions`,
      apiKey: apiKey || "ollama",
      model: modelOverride || "llama3.2",
      provider: "ollama",
    };
  }

  if (provider === "openai") {
    if (!apiKey) return null;
    return {
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey,
      model: modelOverride || "gpt-4o-mini",
      provider: "openai",
    };
  }

  // Custom OpenAI-compatible endpoint
  if (base && apiKey) {
    return {
      endpoint: `${base}/chat/completions`,
      apiKey,
      model: modelOverride || "gpt-5-mini",
      provider: "custom",
    };
  }

  // Manus Forge proxy (inside Sandbox)
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return {
      endpoint: `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`,
      apiKey: ENV.forgeApiKey,
      model: modelOverride || "gpt-5-mini",
      provider: "manus",
    };
  }

  return null;
}

const SYSTEM_PROMPT = `Ты — профессиональный ИИ-ассистент тренера по силовой подготовке в системе FitGuard.
Твоя задача: на основе структурированных данных тренировки подопечного подготовить краткий, экспертный и практический отчёт на РУССКОМ языке для тренера.

Соблюдай тон: уважительный, точный, без «воды», с акцентом на цифры и конкретные действия.
Пиши только валидный JSON (без маркдаун-блоков) со следующими полями:
{
  "summary": "краткая сводка тренировки 2-4 предложения",
  "strengthProgressAnalysis": "разбор динамики рабочих весов по каждому упражнению в сравнении с прошлыми записями",
  "sleepWellnessCorrelation": "анализ взаимосвязи между сном, самочувствием и результатами",
  "anomaliesAndRisks": "выявленные отклонения и риски (падение весов при недосыпе, жалобы на боль, признаки перетренированности) или подтверждение нормы",
  "conclusions": "ключевые выводы списком через •",
  "recommendations": "практические рекомендации тренеру списком через •"
}`;

async function callLLM(config: LLMConfig, userContent: string): Promise<string> {
  const resp = await axios.post(
    config.endpoint,
    {
      model: config.model,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );
  return resp.data?.choices?.[0]?.message?.content || "";
}

function parseLLMJson(raw: string): Partial<StructuredReport> | null {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === "object") return obj;
  } catch {
    // regex fallback extraction
    const fields: (keyof StructuredReport)[] = [
      "summary",
      "strengthProgressAnalysis",
      "sleepWellnessCorrelation",
      "anomaliesAndRisks",
      "conclusions",
      "recommendations",
    ];
    const result: Record<string, string> = {};
    for (const f of fields) {
      const m = cleaned.match(new RegExp(`"${f}"\\s*:\\s*"([\\s\\S]*?)"\\s*[,}]`));
      if (m) result[f] = m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
    if (Object.keys(result).length >= 3) return result as Partial<StructuredReport>;
  }
  return null;
}

// ================= PUBLIC API =================

export async function analyzeWorkout(workoutLogId: number): Promise<StructuredReport> {
  const current = await getWorkoutLog(workoutLogId);
  if (!current) throw new Error("Workout log not found");
  const trainee = await getUserById(current.userId);
  if (!trainee) throw new Error("Trainee not found");

  const previous = await listWorkoutLogs(current.userId, 20);
  const olderThanCurrent = previous.filter(
    (l) => l.id !== current.id && l.workoutDate.getTime() <= current.workoutDate.getTime()
  );

  const baseReport = buildDeterministicReport(trainee, current, olderThanCurrent);

  const llmConfig = resolveLLMConfig();
  if (!llmConfig) {
    await upsertAiReport({
      workoutLogId: current.id,
      userId: current.userId,
      ...baseReport,
    });
    return baseReport;
  }

  const promptPayload = {
    trainee: {
      name: trainee.name,
      currentWeight: trainee.currentWeight,
      heightCm: trainee.heightCm,
    },
    currentWorkout: {
      date: current.workoutDate.toISOString(),
      title: current.title,
      wellness: current.wellness,
      sleepHours: Number(current.sleepHours),
      heartRate: current.heartRate,
      bodyWeight: current.bodyWeight,
      notes: current.notes,
      totalVolumeKg: Number(current.totalVolume),
      totalSets: current.totalSets,
      totalReps: current.totalReps,
      exercises: safeParseExercises(current.exercises),
    },
    progressDeltasVsPrevious: baseReport.progressPerExercise,
    detectedRiskFlags: baseReport.riskFlags,
    riskLevel: baseReport.riskLevel,
    baselineStats: {
      previousWorkoutsCount: olderThanCurrent.length,
      averageSleepRecent:
        olderThanCurrent.length > 0
          ? Number(
              (
                olderThanCurrent.slice(0, 5).reduce((a, b) => a + (Number(b.sleepHours) || 0), 0) /
                Math.min(5, olderThanCurrent.length)
              ).toFixed(1)
            )
          : null,
      averageWellnessRecent:
        olderThanCurrent.length > 0
          ? Number(
              (
                olderThanCurrent.slice(0, 5).reduce((a, b) => a + b.wellness, 0) /
                Math.min(5, olderThanCurrent.length)
              ).toFixed(1)
            )
          : null,
    },
  };

  const startMs = Date.now();
  let modelUsed = `${llmConfig.provider}:${llmConfig.model}`;
  let report = baseReport;
  let rawResponse: string | undefined;

  try {
    const raw = await callLLM(llmConfig, JSON.stringify(promptPayload));
    rawResponse = raw;
    const enriched = parseLLMJson(raw);
    if (enriched) {
      report = {
        ...baseReport,
        summary: enriched.summary || baseReport.summary,
        strengthProgressAnalysis: enriched.strengthProgressAnalysis || baseReport.strengthProgressAnalysis,
        sleepWellnessCorrelation: enriched.sleepWellnessCorrelation || baseReport.sleepWellnessCorrelation,
        anomaliesAndRisks: enriched.anomaliesAndRisks || baseReport.anomaliesAndRisks,
        conclusions: enriched.conclusions || baseReport.conclusions,
        recommendations: enriched.recommendations || baseReport.recommendations,
        modelUsed,
        generationMs: Date.now() - startMs,
      };
    }
  } catch (err: any) {
    console.warn("[AI] LLM call failed, using deterministic engine:", err?.message || err);
    modelUsed = `${llmConfig.provider}:${llmConfig.model} [fallback:deterministic]`;
  }

  await upsertAiReport({
    workoutLogId: current.id,
    userId: current.userId,
    ...report,
    modelUsed,
    generationMs: report.generationMs || Date.now() - startMs,
    rawResponse,
  });

  return report;
}
