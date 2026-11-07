import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { RiskFlagsList } from "@/components/RiskFlagsList";
import { AiReportCard } from "@/components/AiReportCard";
import { ExerciseProgressionChart } from "@/components/charts/ExerciseProgressionChart";
import { SleepWellnessChart } from "@/components/charts/SleepWellnessChart";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { WeightTrendChart } from "@/components/charts/WeightTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Moon,
  TrendingUp,
  Brain,
  Scale,
  Calendar,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function CoachTraineeDetail() {
  const params = useParams<{ id: string }>();
  const traineeId = Number(params.id);
  const [days, setDays] = useState<number>(30);

  const { data: traineeData, isLoading, refetch } = trpc.coach.getTrainee.useQuery(
    { traineeId },
    { enabled: Number.isFinite(traineeId) }
  );
  const { data: analytics, refetch: refetchAnalytics } = trpc.coach.getTraineeAnalytics.useQuery(
    { traineeId, days },
    { enabled: Number.isFinite(traineeId) }
  );

  const [notes, setNotes] = useState<string | null>(null);

  const updateNotes = trpc.coach.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Заметки сохранены");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !traineeData) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
          Загрузка карточки подопечного...
        </div>
      </AppLayout>
    );
  }

  const { trainee, measurements, workouts } = traineeData;
  const initial = trainee.initialWeight ? Number(trainee.initialWeight) : null;
  const current = trainee.currentWeight
    ? Number(trainee.currentWeight)
    : measurements[0]
    ? Number(measurements[0].weight)
    : null;
  const delta = initial !== null && current !== null ? Number((current - initial).toFixed(1)) : null;

  const latestW = workouts[0];
  const lastAi = traineeData.latestAiReport;

  const currentNotes = notes !== null ? notes : trainee.notes || "";

  // Prepare weight chart data
  const weightPoints = [...measurements]
    .reverse()
    .map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      weight: Number(m.weight),
      waist: m.waist ? Number(m.waist) : null,
      bodyFat: m.bodyFat ? Number(m.bodyFat) : null,
    }));

  const volPoints = (analytics?.wellnessSleepSeries || []).map((s) => ({
    date: s.date,
    volume: s.totalVolume,
    title: s.title,
    wellness: s.wellness,
  }));

  const riskFlags = analytics?.riskSummary?.flags || [];

  return (
    <AppLayout
      title={trainee.name || "Подопечный"}
      subtitle={trainee.phone || trainee.email || trainee.username || undefined}
      actions={
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1" asChild>
          <Link href="/coach/trainees">
            <ArrowLeft className="h-3.5 w-3.5" /> Все подопечные
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Profile hero */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
                  {trainee.name ? trainee.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{trainee.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    Логин: @{trainee.username} {trainee.phone && `• ${trainee.phone}`}
                  </p>
                  {lastAi && (
                    <div className="mt-2">
                      <RiskBadge level={lastAi.riskLevel as any} />
                    </div>
                  )}
                </div>
              </div>

              {/* Anthropometry chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Текущий вес</p>
                  <p className="font-bold text-sm sm:text-base">
                    {current ? `${current} кг` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Старт / цель</p>
                  <p className="font-bold text-sm sm:text-base">
                    {initial ? `${initial}` : "—"} / {trainee.targetWeight ? `${trainee.targetWeight}` : "—"} кг
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Рост</p>
                  <p className="font-bold text-sm sm:text-base">
                    {trainee.heightCm ? `${trainee.heightCm} см` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Динамика веса</p>
                  <p
                    className={`font-bold text-sm sm:text-base ${
                      delta !== null && delta < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : delta !== null && delta > 0
                        ? "text-amber-600"
                        : ""
                    }`}
                  >
                    {delta !== null ? `${delta > 0 ? "+" : ""}${delta} кг` : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Coach private notes */}
            <div className="border-t pt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Приватные заметки тренера
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={() => updateNotes.mutate({ traineeId, notes: currentNotes })}
                  disabled={updateNotes.isPending}
                >
                  <Save className="h-3 w-3" /> Сохранить
                </Button>
              </div>
              <Textarea
                value={currentNotes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Заметки по технике, режиму, травмам (видны только вам)..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Средний сон"
            value={analytics?.aggregates?.avgSleep ? `${analytics.aggregates.avgSleep} ч` : "—"}
            subtitle={`за ${days} дней`}
            icon={<Moon className="h-5 w-5" />}
          />
          <StatCard
            title="Среднее самочувствие"
            value={analytics?.aggregates?.avgWellness ? `${analytics.aggregates.avgWellness}/10` : "—"}
            subtitle="шкала 1-10"
            icon={<Brain className="h-5 w-5" />}
          />
          <StatCard
            title="Тренировок"
            value={analytics?.aggregates?.totalWorkouts ?? 0}
            subtitle={`за ${days} дней`}
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            title="Суммарный тоннаж"
            value={
              analytics?.aggregates?.totalVolume
                ? `${Math.round(analytics.aggregates.totalVolume).toLocaleString("ru-RU")} кг`
                : "—"
            }
            subtitle="выполненный объём"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="grid grid-cols-3 max-w-sm">
              <TabsTrigger value="analytics" className="text-xs">
                Аналитика
              </TabsTrigger>
              <TabsTrigger value="workouts" className="text-xs">
                Тренировки ({workouts.length})
              </TabsTrigger>
              <TabsTrigger value="measurements" className="text-xs">
                Замеры ({measurements.length})
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Период:</span>
              {[7, 30, 90, 365].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={days === d ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setDays(d)}
                >
                  {d === 7 ? "7 дн" : d === 30 ? "30 дн" : d === 90 ? "3 мес" : "Год"}
                </Button>
              ))}
            </div>
          </div>

          {/* TAB 1: Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            {/* Latest AI report */}
            {lastAi ? (
              <AiReportCard
                report={lastAi}
                workoutId={latestW?.id}
                onRefresh={() => {
                  refetch();
                  refetchAnalytics();
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-xs text-muted-foreground">
                  ИИ-отчёт появится сразу после первой заполненной тренировки
                </CardContent>
              </Card>
            )}

            {/* Risk flags banner */}
            <Card>
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm sm:text-base">Индикаторы риска</CardTitle>
                    <RiskBadge level={analytics?.riskSummary?.high ? "high" : analytics?.riskSummary?.medium ? "medium" : "low"} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    высоких: {analytics?.riskSummary?.high ?? 0} • средних: {analytics?.riskSummary?.medium ?? 0}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2">
                <RiskFlagsList flags={riskFlags} emptyText="За выбранный период сигналов риска не обнаружено" />
              </CardContent>
            </Card>

            {/* Progression chart */}
            <ExerciseProgressionChart
              series={analytics?.progressSeries || {}}
              prs={analytics?.exercisePRs || {}}
              title="Динамика силовых по упражнению"
            />

            {/* Sleep & wellness */}
            <SleepWellnessChart data={analytics?.wellnessSleepSeries || []} />

            {/* Volume */}
            <VolumeChart data={volPoints} />
          </TabsContent>

          {/* TAB 2: Workouts list */}
          <TabsContent value="workouts" className="space-y-3">
            {workouts.map((w) => {
              let exercises: any[] = [];
              try {
                exercises = JSON.parse(w.exercises);
              } catch {}
              return (
                <Card key={w.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base">{w.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(w.workoutDate).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                        <Link href={`/trainee/workout/${w.id}`}>Открыть ИИ-отчёт →</Link>
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        Самочувствие: <b>{w.wellness}/10</b>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        Сон: <b>{w.sleepHours} ч</b>
                      </span>
                      {w.heartRate && (
                        <span className="rounded-md bg-muted px-2 py-1 font-medium">
                          Пульс: <b>{w.heartRate}</b>
                        </span>
                      )}
                      {w.bodyWeight && (
                        <span className="rounded-md bg-muted px-2 py-1 font-medium">
                          Вес: <b>{w.bodyWeight} кг</b>
                        </span>
                      )}
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        Объём: <b>{Math.round(Number(w.totalVolume)).toLocaleString("ru-RU")} кг</b>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        {w.totalSets} подх. • {w.totalReps} повт.
                      </span>
                    </div>

                    {/* Exercises chips */}
                    {exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {exercises.map((e: any, idx: number) => {
                          const maxW = Math.max(...(e.sets || []).map((s: any) => s.weight || 0));
                          return (
                            <Badge key={idx} variant="secondary" className="text-xs font-normal">
                              {e.name}: <b>{maxW} кг</b>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {w.notes && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                        «{w.notes}»
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* TAB 3: Measurements */}
          <TabsContent value="measurements" className="space-y-4">
            <WeightTrendChart
              data={weightPoints}
              targetWeight={trainee.targetWeight ? Number(trainee.targetWeight) : null}
              initialWeight={initial}
            />
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">История замеров</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-muted-foreground text-[11px]">
                        <th className="py-2">Дата</th>
                        <th className="py-2">Вес</th>
                        <th className="py-2">Талия</th>
                        <th className="py-2">Бёдра</th>
                        <th className="py-2">Грудь</th>
                        <th className="py-2">Бицепс</th>
                        <th className="py-2">Жир %</th>
                        <th className="py-2">Заметка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 font-medium">
                            {new Date(m.measuredAt).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="py-2 font-bold">{m.weight} кг</td>
                          <td className="py-2">{m.waist ? `${m.waist}` : "—"}</td>
                          <td className="py-2">{m.hips ? `${m.hips}` : "—"}</td>
                          <td className="py-2">{m.chest ? `${m.chest}` : "—"}</td>
                          <td className="py-2">{m.biceps ? `${m.biceps}` : "—"}</td>
                          <td className="py-2">{m.bodyFat ? `${m.bodyFat}%` : "—"}</td>
                          <td className="py-2 text-muted-foreground max-w-[200px] truncate">
                            {m.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
