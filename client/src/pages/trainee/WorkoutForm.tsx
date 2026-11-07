import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Copy,
  Dumbbell,
  Moon,
  Heart,
  Scale,
  Brain,
  Sparkles,
  Loader2,
  Smile,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FormSet {
  set: number;
  weight: number;
  reps: number;
  isWarmup?: boolean;
}

interface FormExercise {
  name: string;
  category?: string;
  notes?: string;
  sets: FormSet[];
}

const TITLE_PRESETS = ["Фуллбоди", "Верх тела", "Низ тела", "Грудь + трицепс", "Спина + бицепс", "Плечи", "Ноги + ягодицы", "Кардио"];

const EXERCISE_PRESETS = [
  "Присед со штангой",
  "Жим лёжа",
  "Становая тяга",
  "Тяга верхнего блока",
  "Жим гантелей сидя",
  "Ягодичный мост со штангой",
  "Румынская тяга",
  "Сгибания ног лёжа",
  "Жим ногами",
  "Брусья с весом",
  "Тяга горизонтального блока",
  "Подтягивания",
];

const WELLNESS_EMOJIS = ["", "😩", "😫", "😞", "😕", "😐", "🙂", "😀", "😃", "🤩", "🚀"];
const WELLNESS_LABELS = [
  "",
  "Ужасно",
  "Очень плохо",
  "Плохо",
  "Слабо",
  "Нормально",
  "Хорошо",
  "Отлично",
  "Превосходно",
  "Идеально",
  "На максимуме",
];

function parseProgram(raw: string): FormExercise[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((exercise) => ({
        name: String(exercise?.name || ""),
        category: exercise?.category,
        notes: exercise?.notes,
        sets: Array.isArray(exercise?.sets)
          ? exercise.sets.map((set: any, index: number) => ({
              set: index + 1,
              weight: Number(set?.weight) || 0,
              reps: Number(set?.reps) || 0,
              isWarmup: Boolean(set?.isWarmup),
            }))
          : [],
      }))
      .filter((exercise) => exercise.name.trim() && exercise.sets.length > 0);
  } catch {
    return [];
  }
}

export default function WorkoutForm() {
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("Фуллбоди");
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [wellness, setWellness] = useState<number>(7);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [heartRate, setHeartRate] = useState<string>("");
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("60");
  const [energyLevel, setEnergyLevel] = useState<number | null>(4);
  const [notes, setNotes] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const previousWorkoutsQuery = trpc.trainee.listWorkouts.useQuery({ limit: 30 });

  const [exercises, setExercises] = useState<FormExercise[]>([
    {
      name: "Жим лёжа",
      sets: [
        { set: 1, weight: 60, reps: 8, isWarmup: true },
        { set: 2, weight: 70, reps: 6 },
        { set: 3, weight: 70, reps: 6 },
      ],
    },
    {
      name: "Тяга верхнего блока",
      sets: [
        { set: 1, weight: 60, reps: 10 },
        { set: 2, weight: 60, reps: 10 },
      ],
    },
  ]);

  const totals = useMemo(() => {
    let volume = 0;
    let sets = 0;
    let reps = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) {
        sets += 1;
        reps += s.reps || 0;
        if (!s.isWarmup) volume += (s.weight || 0) * (s.reps || 0);
      }
    }
    return { volume, sets, reps };
  }, [exercises]);

  const submit = trpc.trainee.submitWorkout.useMutation({
    onSuccess: ({ workout, aiReport }) => {
      toast.success("Тренировка отправлена тренеру!");
      navigate(`/trainee/workout/${workout.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const addExercise = (name = "") => {
    setExercises((prev) => [
      ...prev,
      {
        name,
        sets: [
          { set: 1, weight: 0, reps: 8 },
          { set: 2, weight: 0, reps: 8 },
        ],
      },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateExerciseName = (idx: number, name: string) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? { ...e, name } : e)));
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            { set: e.sets.length + 1, weight: last ? last.weight : 0, reps: last ? last.reps : 8 },
          ],
        };
      })
    );
  };

  const duplicateLastSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx || e.sets.length === 0) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, { ...last, set: e.sets.length + 1 }],
        };
      })
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        const filtered = e.sets.filter((_, si) => si !== setIdx);
        return { ...e, sets: filtered.map((s, si) => ({ ...s, set: si + 1 })) };
      })
    );
  };

  const applyPreviousProgram = (workoutId: string) => {
    if (!workoutId) return;
    const previous = previousWorkoutsQuery.data?.find(({ workout }) => String(workout.id) === workoutId);
    if (!previous) return;
    const program = parseProgram(previous.workout.exercises);
    if (program.length === 0) {
      toast.error("В этой тренировке не удалось найти программу упражнений");
      return;
    }
    setExercises(program);
    setTitle(previous.workout.title);
    toast.success(`Программа «${previous.workout.title}» загружена`);
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: "weight" | "reps" | "isWarmup",
    value: number | boolean
  ) => {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        return {
          ...e,
          sets: e.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)),
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanExercises = exercises
      .map((ex) => ({
        name: ex.name.trim(),
        sets: ex.sets.map((s) => ({
          set: s.set,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          isWarmup: s.isWarmup || false,
        })),
      }))
      .filter((ex) => ex.name.length > 0 && ex.sets.length > 0);

    if (cleanExercises.length === 0) {
      toast.error("Добавьте хотя бы одно упражнение с подходами");
      return;
    }

    submit.mutate({
      title: title.trim() || "Тренировка",
      workoutDate: new Date(workoutDate),
      wellness,
      sleepHours,
      heartRate: heartRate ? Number(heartRate) : null,
      bodyWeight: bodyWeight ? Number(bodyWeight) : null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      notes: notes.trim() || undefined,
      exercises: cleanExercises,
    });
  };

  return (
    <AppLayout
      title="Новая тренировка"
      subtitle="Заполните журнал после занятия — ИИ сразу сформирует отчёт для тренера"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-10">
        {/* Basic info */}
        <Card>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" /> Основные данные
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Название тренировки</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Фуллбоди, Ноги, Верх тела..."
                className="text-xs h-9"
                required
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {TITLE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTitle(p)}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                      title === p ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <Label htmlFor="previous-program" className="flex items-center gap-1.5 text-xs">
                  <History className="h-3.5 w-3.5 text-primary" /> Загрузить прошлую программу
                </Label>
                <select
                  id="previous-program"
                  defaultValue=""
                  onChange={(e) => applyPreviousProgram(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                  disabled={previousWorkoutsQuery.isLoading}
                >
                  <option value="">
                    {previousWorkoutsQuery.isLoading ? "Загружаем историю..." : "Выберите тренировку из истории"}
                  </option>
                  {previousWorkoutsQuery.data?.map(({ workout }) => (
                    <option key={workout.id} value={workout.id}>
                      {new Date(workout.workoutDate).toLocaleDateString("ru-RU")} — {workout.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Упражнения, подходы, веса и повторы будут скопированы в текущую тренировку. Данные сна и самочувствия останутся текущими.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Дата и время начала</Label>
              <Input
                type="datetime-local"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Wellness - core subjective metric */}
        <Card>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Smile className="h-4 w-4 text-primary" /> Самочувствие (1–10)
              </CardTitle>
              <span className="text-xs font-bold text-primary">
                {WELLNESS_EMOJIS[wellness]} {wellness}/10 — {WELLNESS_LABELS[wellness]}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={wellness}
              onChange={(e) => setWellness(Number(e.target.value))}
              className="w-full accent-primary h-2 cursor-pointer"
            />
            {/* Quick pills */}
            <div className="grid grid-cols-10 gap-1 text-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWellness(n)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    wellness === n
                      ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                      : "hover:bg-muted/70 text-muted-foreground"
                  )}
                >
                  <div className="text-[10px] sm:text-xs">{WELLNESS_EMOJIS[n]}</div>
                  <div>{n}</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Субъективная оценка общего состояния, энергии и настроения в день тренировки
            </p>
          </CardContent>
        </Card>

        {/* Sleep - recovery metric */}
        <Card>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Moon className="h-4 w-4 text-primary" /> Сон перед тренировкой
              </CardTitle>
              <span className="text-xs font-bold text-primary">{sleepHours} ч</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-primary h-2 cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5">
              {[4, 5, 6, 7, 7.5, 8, 8.5, 9, 10].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSleepHours(h)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium",
                    sleepHours === h
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {h} ч
                </button>
              ))}
            </div>
            {sleepHours < 6 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Менее 6 часов сна — ИИ отметит риск недовосстановления
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes with pain detection hints */}
        <Card>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <CardTitle className="text-sm sm:text-base">Заметки и жалобы на боль</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Как шли веса? Есть ли боль, дискомфорт в коленях/плечах/спине? Уровень усталости? Жалобы автоматически попадут в ИИ-отчёт для тренера..."
              rows={3}
              className="text-xs resize-none"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3 shrink-0" /> Слова вроде «болит колено», «тянет плечо» ИИ распознаёт и подсвечивает тренеру как индикатор риска
            </p>
          </CardContent>
        </Card>

        {/* Optional metrics */}
        <Card>
          <CardHeader
            className="p-4 sm:p-5 pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setShowOptional(!showOptional)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> Дополнительные параметры
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>пульс, вес, длительность</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showOptional && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
          {showOptional && (
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="hr" className="text-xs">
                    Пульс покоя, уд/мин
                  </Label>
                  <Input
                    id="hr"
                    type="number"
                    min="30"
                    max="220"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="65"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bw" className="text-xs">
                    Вес тела, кг
                  </Label>
                  <Input
                    id="bw"
                    type="number"
                    step="0.1"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    placeholder="82.5"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dur" className="text-xs">
                    Длительность, мин
                  </Label>
                  <Input
                    id="dur"
                    type="number"
                    min="5"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="60"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Exercises builder */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" /> Программа тренировки
              </h2>
              <p className="text-xs text-muted-foreground">
                Укажите рабочие веса, подходы и повторения по каждому упражнению
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs h-9 gap-1"
              onClick={() => addExercise()}
            >
              <Plus className="h-4 w-4" /> Добавить упражнение
            </Button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1 text-[11px]">
            <span className="text-muted-foreground self-center mr-1">Быстрый выбор:</span>
            {EXERCISE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => addExercise(p)}
                className="px-2 py-0.5 rounded-full border hover:bg-muted text-muted-foreground cursor-pointer transition-all"
              >
                + {p}
              </button>
            ))}
          </div>

          {exercises.map((ex, exIdx) => (
            <Card key={exIdx} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <Input
                      value={ex.name}
                      onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                      placeholder="Название упражнения"
                      className="text-sm font-bold h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeExercise(exIdx)}
                    disabled={exercises.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sets table */}
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-muted-foreground text-[11px]">
                        <th className="py-1 w-10">Сет</th>
                        <th className="py-1 w-24">Вес, кг</th>
                        <th className="py-1 w-24">Повторы</th>
                        <th className="py-1 w-28 text-center">Разминка</th>
                        <th className="py-1 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((s, sIdx) => (
                        <tr key={sIdx} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="py-1.5 font-bold text-muted-foreground">{s.set}</td>
                          <td className="py-1.5 pr-2">
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={s.weight}
                              onChange={(e) =>
                                updateSet(exIdx, sIdx, "weight", Number(e.target.value) || 0)
                              }
                              className="h-8 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <Input
                              type="number"
                              min="1"
                              value={s.reps}
                              onChange={(e) =>
                                updateSet(exIdx, sIdx, "reps", Number(e.target.value) || 0)
                              }
                              className="h-8 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(s.isWarmup)}
                              onChange={(e) => updateSet(exIdx, sIdx, "isWarmup", e.target.checked)}
                              className="h-4 w-4 accent-primary"
                            />
                          </td>
                          <td className="py-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeSet(exIdx, sIdx)}
                              disabled={ex.sets.length <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 gap-1"
                    onClick={() => addSet(exIdx)}
                  >
                    <Plus className="h-3 w-3" /> Подход
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-7 gap-1 text-muted-foreground"
                    onClick={() => duplicateLastSet(exIdx)}
                  >
                    <Copy className="h-3 w-3" /> Дублировать вес
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Live totals bar */}
        <div className="rounded-2xl border bg-muted/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-muted-foreground">Тоннаж: </span>
              <b className="text-foreground text-sm">
                {Math.round(totals.volume).toLocaleString("ru-RU")} кг
              </b>
            </div>
            <div>
              <span className="text-muted-foreground">Подходов: </span>
              <b className="text-foreground text-sm">{totals.sets}</b>
            </div>
            <div>
              <span className="text-muted-foreground">Повторений: </span>
              <b className="text-foreground text-sm">{totals.reps}</b>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">разминочные сеты исключены из тоннажа</span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-sm sm:text-base gap-2 shadow-md"
          disabled={submit.isPending}
        >
          {submit.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ИИ анализирует тренировку...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Отправить тренировку тренеру
            </>
          )}
        </Button>
      </form>
    </AppLayout>
  );
}
