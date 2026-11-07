import { getDb } from "./db";
import { hashPassword, createSession } from "./auth";
import {
  users,
  coachInviteCodes,
  coachTrainees,
  bodyMeasurements,
  workoutLogs,
  aiReports,
} from "../drizzle/schema";
import { analyzeWorkout } from "./aiService";
import { eq } from "drizzle-orm";

export async function runSeed(): Promise<{ seeded: boolean; coach: any; trainee: any; trainee2: any }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already seeded
  const existingCoach = await db.select().from(users).where(eq(users.username, "coach")).limit(1);
  if (existingCoach.length > 0) {
    const existingTrainee = await db.select().from(users).where(eq(users.username, "ivan")).limit(1);
    const existingTrainee2 = await db.select().from(users).where(eq(users.username, "maria")).limit(1);
    return {
      seeded: false,
      coach: existingCoach[0],
      trainee: existingTrainee[0] || null,
      trainee2: existingTrainee2[0] || null,
    };
  }

  // 1. Create coach
  await db.insert(users).values({
    username: "coach",
    email: "coach@fitguard.ru",
    passwordHash: hashPassword("coach123"),
    name: "Анна Смирнова",
    role: "coach",
    phone: "+7 (999) 234-56-78",
    notes: "Сертифицированный тренер FPA, специализация: силовая подготовка и гипертрофия. Опыт 7 лет.",
    loginMethod: "credentials",
  });
  const coachRows = await db.select().from(users).where(eq(users.username, "coach")).limit(1);
  const coach = coachRows[0];

  // 2. Create trainee 1 - Ivan (strength progression)
  await db.insert(users).values({
    username: "ivan",
    email: "ivan@fitguard.ru",
    passwordHash: hashPassword("ivan123"),
    name: "Иван Петров",
    role: "trainee",
    phone: "+7 (916) 555-12-34",
    heightCm: 182,
    initialWeight: "84.5",
    currentWeight: "82.3",
    targetWeight: "80.0",
    notes: "Цель: рекомпозиция, увеличение рабочих весов в большой тройке. Программа: верх/низ 4 раза в неделю.",
    loginMethod: "credentials",
  });
  const ivanRows = await db.select().from(users).where(eq(users.username, "ivan")).limit(1);
  const ivan = ivanRows[0];

  // 3. Create trainee 2 - Maria (fat loss + wellness focus)
  await db.insert(users).values({
    username: "maria",
    email: "maria@fitguard.ru",
    passwordHash: hashPassword("maria123"),
    name: "Мария Орлова",
    role: "trainee",
    phone: "+7 (925) 777-98-10",
    heightCm: 168,
    initialWeight: "65.4",
    currentWeight: "62.1",
    targetWeight: "60.0",
    notes: "Цель: снижение жировой массы и укрепление ягодичных/спины. Работает с умеренным дефицитом калорий.",
    loginMethod: "credentials",
  });
  const mariaRows = await db.select().from(users).where(eq(users.username, "maria")).limit(1);
  const maria = mariaRows[0];

  // 4. Link coach <-> trainees
  await db.insert(coachTrainees).values([
    {
      coachId: coach.id,
      traineeId: ivan.id,
      status: "active",
      inviteCodeUsed: "FP-742-WK9X",
      coachNotes: "Хорошая дисциплина. Периодически недосыпает из-за работы — следить за режимом. Следить за правым коленом.",
    },
    {
      coachId: coach.id,
      traineeId: maria.id,
      status: "active",
      inviteCodeUsed: "FP-742-WK9X",
      coachNotes: "Отличный сон и восстановление. Стабильно прогрессирует по ягодичному мосту. Взвешивание каждое воскресенье.",
    },
  ]);

  // 5. Create coach invite code
  await db.insert(coachInviteCodes).values({
    coachId: coach.id,
    code: "FP-742-WK9X",
    maxUses: 10,
    usesCount: 2,
    isActive: 1,
    expiresAt: new Date(Date.now() + 60 * 86400000),
  });

  // 6. Measurements Ivan
  await db.insert(bodyMeasurements).values([
    {
      userId: ivan.id,
      measuredAt: new Date(Date.now() - 25 * 86400000),
      weight: "84.5",
      heightCm: 182,
      chest: "106",
      waist: "91",
      hips: "103",
      biceps: "39",
      thigh: "61",
      bodyFat: "19.5",
      notes: "Стартовые замеры. Талия 91 см.",
    },
    {
      userId: ivan.id,
      measuredAt: new Date(Date.now() - 11 * 86400000),
      weight: "83.1",
      heightCm: 182,
      chest: "106.5",
      waist: "88",
      hips: "102",
      biceps: "39.5",
      thigh: "60.5",
      bodyFat: "18.2",
      notes: "Промежуточный контроль: −1.4 кг, талия −3 см.",
    },
    {
      userId: ivan.id,
      measuredAt: new Date(Date.now() - 2 * 86400000),
      weight: "82.3",
      heightCm: 182,
      chest: "107",
      waist: "86.5",
      hips: "101.5",
      biceps: "40",
      thigh: "60",
      bodyFat: "17.1",
      notes: "Текущий замер: суммарно −2.2 кг жира, руки +1 см.",
    },
  ]);

  // 7. Measurements Maria
  await db.insert(bodyMeasurements).values([
    {
      userId: maria.id,
      measuredAt: new Date(Date.now() - 21 * 86400000),
      weight: "65.4",
      heightCm: 168,
      waist: "74",
      hips: "98",
      bodyFat: "27.5",
      notes: "Начало программы снижения веса.",
    },
    {
      userId: maria.id,
      measuredAt: new Date(Date.now() - 7 * 86400000),
      weight: "63.2",
      heightCm: 168,
      waist: "71",
      hips: "96.5",
      bodyFat: "25.8",
      notes: "Прогресс стабильный, самочувствие на высоте.",
    },
    {
      userId: maria.id,
      measuredAt: new Date(Date.now() - 1 * 86400000),
      weight: "62.1",
      heightCm: 168,
      waist: "69",
      hips: "95.5",
      bodyFat: "24.6",
      notes: "Итого: −3.3 кг и −5 см в талии за 3 недели.",
    },
  ]);

  // 8. Workouts Ivan (8 workouts with realistic progression + one bad day)
  const ivanWorkouts = [
    {
      daysAgo: 24,
      title: "Низ тела — вводная",
      wellness: 7,
      sleepHours: 7.5,
      heartRate: 64,
      bodyWeight: "84.5",
      notes: "Первая тренировка цикла, привыкаю к нагрузке.",
      exercises: [
        { name: "Присед со штангой", sets: [{ set: 1, weight: 80, reps: 6 }, { set: 2, weight: 80, reps: 6 }, { set: 3, weight: 80, reps: 6 }] },
        { name: "Румынская тяга", sets: [{ set: 1, weight: 110, reps: 8 }, { set: 2, weight: 110, reps: 8 }, { set: 3, weight: 110, reps: 8 }] },
        { name: "Сгибания ног лёжа", sets: [{ set: 1, weight: 45, reps: 12 }, { set: 2, weight: 45, reps: 12 }] },
      ],
    },
    {
      daysAgo: 21,
      title: "Верх тела — жим",
      wellness: 8,
      sleepHours: 8,
      heartRate: 62,
      bodyWeight: "84.2",
      notes: "Отличное восстановление, легко жал.",
      exercises: [
        { name: "Жим лёжа", sets: [{ set: 1, weight: 65, reps: 6 }, { set: 2, weight: 65, reps: 6 }, { set: 3, weight: 65, reps: 6 }] },
        { name: "Тяга верхнего блока", sets: [{ set: 1, weight: 60, reps: 10 }, { set: 2, weight: 60, reps: 10 }, { set: 3, weight: 60, reps: 10 }] },
        { name: "Жим гантелей сидя", sets: [{ set: 1, weight: 20, reps: 10 }, { set: 2, weight: 20, reps: 10 }] },
      ],
    },
    {
      daysAgo: 17,
      title: "Низ тела — прогрессия приседа",
      wellness: 7,
      sleepHours: 7,
      heartRate: 66,
      bodyWeight: "83.8",
      notes: "Добавил 5 кг на присед, техника чистая.",
      exercises: [
        { name: "Присед со штангой", sets: [{ set: 1, weight: 85, reps: 6 }, { set: 2, weight: 85, reps: 6 }, { set: 3, weight: 85, reps: 6 }] },
        { name: "Становая тяга", sets: [{ set: 1, weight: 115, reps: 5 }, { set: 2, weight: 115, reps: 5 }] },
        { name: "Жим ногами", sets: [{ set: 1, weight: 200, reps: 10 }, { set: 2, weight: 200, reps: 10 }, { set: 3, weight: 200, reps: 10 }] },
      ],
    },
    {
      daysAgo: 14,
      title: "Верх тела — рекорд жима",
      wellness: 8,
      sleepHours: 8.5,
      heartRate: 60,
      bodyWeight: "83.5",
      notes: "Рекордный жим 70 кг! Сон 8.5 ч делает разницу.",
      exercises: [
        { name: "Жим лёжа", sets: [{ set: 1, weight: 70, reps: 6 }, { set: 2, weight: 70, reps: 6 }, { set: 3, weight: 70, reps: 6 }] },
        { name: "Тяга верхнего блока", sets: [{ set: 1, weight: 65, reps: 10 }, { set: 2, weight: 65, reps: 10 }, { set: 3, weight: 65, reps: 10 }] },
        { name: "Брусья с весом", sets: [{ set: 1, weight: 10, reps: 8 }, { set: 2, weight: 10, reps: 8 }] },
      ],
    },
    {
      daysAgo: 10,
      title: "Низ тела — стабильный рост",
      wellness: 7,
      sleepHours: 7,
      heartRate: 65,
      bodyWeight: "83.1",
      notes: "90 кг на 6 повторов — уверенно.",
      exercises: [
        { name: "Присед со штангой", sets: [{ set: 1, weight: 90, reps: 6 }, { set: 2, weight: 90, reps: 6 }, { set: 3, weight: 90, reps: 5 }] },
        { name: "Становая тяга", sets: [{ set: 1, weight: 120, reps: 5 }, { set: 2, weight: 120, reps: 5 }] },
        { name: "Сгибания ног лёжа", sets: [{ set: 1, weight: 50, reps: 12 }, { set: 2, weight: 50, reps: 12 }] },
      ],
    },
    {
      daysAgo: 7,
      title: "Верх тела — срыв режима",
      wellness: 3,
      sleepHours: 4.5,
      heartRate: 78,
      bodyWeight: "83.3",
      notes: "Ужасно не выспался из-за дедлайна на работе. Болит правое колено после прошлого приседа, веса шли очень тяжело, снял 5 кг с жима.",
      exercises: [
        { name: "Жим лёжа", sets: [{ set: 1, weight: 65, reps: 6 }, { set: 2, weight: 65, reps: 5 }] },
        { name: "Тяга верхнего блока", sets: [{ set: 1, weight: 55, reps: 10 }, { set: 2, weight: 55, reps: 10 }] },
        { name: "Жим гантелей сидя", sets: [{ set: 1, weight: 18, reps: 10 }, { set: 2, weight: 18, reps: 10 }] },
      ],
    },
    {
      daysAgo: 4,
      title: "Низ тела — реабилитационный",
      wellness: 6,
      sleepHours: 8,
      heartRate: 68,
      bodyWeight: "82.8",
      notes: "Колено почти прошло, аккуратный присед 92.5 кг, техникой доволен.",
      exercises: [
        { name: "Присед со штангой", sets: [{ set: 1, weight: 92.5, reps: 6 }, { set: 2, weight: 92.5, reps: 6 }, { set: 3, weight: 92.5, reps: 6 }] },
        { name: "Румынская тяга", sets: [{ set: 1, weight: 115, reps: 8 }, { set: 2, weight: 115, reps: 8 }] },
        { name: "Жим ногами", sets: [{ set: 1, weight: 210, reps: 10 }, { set: 2, weight: 210, reps: 10 }] },
      ],
    },
    {
      daysAgo: 1,
      title: "Верх тела — новый рекорд",
      wellness: 9,
      sleepHours: 8,
      heartRate: 61,
      bodyWeight: "82.3",
      notes: "Полное восстановление, жим 75 кг на 6 повторов — личный рекорд цикла!",
      exercises: [
        { name: "Жим лёжа", sets: [{ set: 1, weight: 75, reps: 6 }, { set: 2, weight: 75, reps: 6 }, { set: 3, weight: 75, reps: 5 }] },
        { name: "Тяга верхнего блока", sets: [{ set: 1, weight: 70, reps: 10 }, { set: 2, weight: 70, reps: 10 }, { set: 3, weight: 70, reps: 9 }] },
        { name: "Жим гантелей сидя", sets: [{ set: 1, weight: 22, reps: 10 }, { set: 2, weight: 22, reps: 10 }] },
      ],
    },
  ];

  // 9. Workouts Maria (6 workouts, stable fat loss)
  const mariaWorkouts = [
    {
      daysAgo: 20,
      title: "Ягодичный мост + спина",
      wellness: 8,
      sleepHours: 8,
      bodyWeight: "65.4",
      notes: "Стартовая тренировка блока, техника под контролем.",
      exercises: [
        { name: "Ягодичный мост со штангой", sets: [{ set: 1, weight: 60, reps: 12 }, { set: 2, weight: 60, reps: 12 }, { set: 3, weight: 60, reps: 12 }] },
        { name: "Тяга вертикального блока", sets: [{ set: 1, weight: 35, reps: 12 }, { set: 2, weight: 35, reps: 12 }, { set: 3, weight: 35, reps: 12 }] },
        { name: "Гиперэкстензия", sets: [{ set: 1, weight: 10, reps: 15 }, { set: 2, weight: 10, reps: 15 }] },
      ],
    },
    {
      daysAgo: 16,
      title: "Ноги + верх",
      wellness: 7,
      sleepHours: 7.5,
      bodyWeight: "64.8",
      notes: "Хорошая концентрация, спала глубоко.",
      exercises: [
        { name: "Присед гоблет", sets: [{ set: 1, weight: 24, reps: 12 }, { set: 2, weight: 24, reps: 12 }, { set: 3, weight: 24, reps: 12 }] },
        { name: "Румынская тяга с гантелями", sets: [{ set: 1, weight: 50, reps: 12 }, { set: 2, weight: 50, reps: 12 }] },
        { name: "Тяга горизонтального блока", sets: [{ set: 1, weight: 30, reps: 12 }, { set: 2, weight: 30, reps: 12 }] },
      ],
    },
    {
      daysAgo: 12,
      title: "Ягодицы — прогрессия",
      wellness: 9,
      sleepHours: 8.5,
      bodyWeight: "64.1",
      notes: "Мост 70 кг, очень чистое выполнение!",
      exercises: [
        { name: "Ягодичный мост со штангой", sets: [{ set: 1, weight: 70, reps: 12 }, { set: 2, weight: 70, reps: 12 }, { set: 3, weight: 70, reps: 11 }] },
        { name: "Тяга вертикального блока", sets: [{ set: 1, weight: 40, reps: 12 }, { set: 2, weight: 40, reps: 12 }] },
        { name: "Отведения ноги назад", sets: [{ set: 1, weight: 12, reps: 15 }, { set: 2, weight: 12, reps: 15 }] },
      ],
    },
    {
      daysAgo: 8,
      title: "Верх тела",
      wellness: 8,
      sleepHours: 8,
      bodyWeight: "63.2",
      notes: "Энергии много, питание соблюдаю.",
      exercises: [
        { name: "Тяга вертикального блока", sets: [{ set: 1, weight: 42.5, reps: 12 }, { set: 2, weight: 42.5, reps: 12 }] },
        { name: "Жим гантелей на наклонной", sets: [{ set: 1, weight: 12, reps: 12 }, { set: 2, weight: 12, reps: 12 }, { set: 3, weight: 12, reps: 12 }] },
        { name: "Тяга горизонтального блока", sets: [{ set: 1, weight: 35, reps: 12 }, { set: 2, weight: 35, reps: 12 }] },
      ],
    },
    {
      daysAgo: 5,
      title: "Ягодицы — новый рекорд",
      wellness: 9,
      sleepHours: 9,
      bodyWeight: "62.7",
      notes: "75 кг на мост — личный рекорд! Настроение отличное.",
      exercises: [
        { name: "Ягодичный мост со штангой", sets: [{ set: 1, weight: 75, reps: 12 }, { set: 2, weight: 75, reps: 12 }, { set: 3, weight: 75, reps: 10 }] },
        { name: "Румынская тяга с гантелями", sets: [{ set: 1, weight: 55, reps: 12 }, { set: 2, weight: 55, reps: 12 }] },
        { name: "Разведения ног в тренажёре", sets: [{ set: 1, weight: 40, reps: 15 }, { set: 2, weight: 40, reps: 15 }] },
      ],
    },
    {
      daysAgo: 2,
      title: "Финишная тренировка недели",
      wellness: 8,
      sleepHours: 8,
      bodyWeight: "62.1",
      notes: "80 кг на мост — новый рекорд! Чувствую себя легко и бодро.",
      exercises: [
        { name: "Ягодичный мост со штангой", sets: [{ set: 1, weight: 80, reps: 12 }, { set: 2, weight: 80, reps: 12 }, { set: 3, weight: 80, reps: 12 }] },
        { name: "Тяга вертикального блока", sets: [{ set: 1, weight: 45, reps: 12 }, { set: 2, weight: 45, reps: 12 }] },
        { name: "Гиперэкстензия", sets: [{ set: 1, weight: 15, reps: 15 }, { set: 2, weight: 15, reps: 15 }] },
      ],
    },
  ];

  interface WItem { daysAgo: number; title: string; wellness: number; sleepHours: number; heartRate?: number; bodyWeight?: string; notes?: string; exercises: any[]; } async function insertWorkouts(user: any, list: WItem[]) { if (!db) throw new Error("db null");
    const ids: number[] = [];
    for (const w of list) {
      const totals = calcTotals(w.exercises as any);
      const res = await db.insert(workoutLogs).values({
        userId: user.id,
        workoutDate: new Date(Date.now() - w.daysAgo * 86400000),
        title: w.title,
        wellness: w.wellness,
        sleepHours: String(w.sleepHours),
        heartRate: (w as any).heartRate ?? null,
        bodyWeight: w.bodyWeight ?? null,
        notes: w.notes,
        durationMinutes: 60,
        exercises: JSON.stringify(w.exercises),
        totalVolume: String(totals.volume),
        totalSets: totals.sets,
        totalReps: totals.reps,
      });
      const id = (res as any)[0]?.insertId ?? Number((res as any).insertId);
      ids.push(id);
    }
    return ids;
  }

  function calcTotals(exercises: any[]) {
    let volume = 0, sets = 0, reps = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) {
        sets += 1;
        reps += s.reps || 0;
        volume += (s.weight || 0) * (s.reps || 0);
      }
    }
    return { volume, sets, reps };
  }

  const ivanIds = await insertWorkouts(ivan, ivanWorkouts);
  const mariaIds = await insertWorkouts(maria, mariaWorkouts);

  // 10. Generate AI reports in chronological order
  for (const id of ivanIds) {
    try {
      await analyzeWorkout(id);
    } catch (e: any) {
      console.warn("AI report failed for workout", id, e?.message);
    }
  }
  for (const id of mariaIds) {
    try {
      await analyzeWorkout(id);
    } catch (e: any) {
      console.warn("AI report failed for workout", id, e?.message);
    }
  }

  return { seeded: true, coach, trainee: ivan, trainee2: maria };
}

export async function createDemoSession(role: "coach" | "trainee"): Promise<{ user: any; token: string }> {
  const { coach, trainee } = await runSeed();
  const user = role === "coach" ? coach : trainee;
  if (!user) throw new Error("Demo user unavailable");
  const token = await createSession(user.id);
  return { user, token };
}
