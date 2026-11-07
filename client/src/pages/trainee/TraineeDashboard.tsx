import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Dumbbell,
  Moon,
  Brain,
  Scale,
  Sparkles,
  ArrowRight,
  UserCheck,
  TrendingUp,
} from "lucide-react";

export default function TraineeDashboard() {
  const { data: stats, isLoading } = trpc.trainee.getMyStats.useQuery();
  const { data: workouts, refetch } = trpc.trainee.listWorkouts.useQuery({ limit: 5 });
  const { data: coaches } = trpc.trainee.myCoaches.useQuery();

  const last = workouts?.[0];
  const lastAi = last?.aiReport;
  const noCoach = coaches && coaches.length === 0;

  return (
    <AppLayout
      title="Кабинет ученика"
      subtitle="Заполняйте журнал после каждой тренировки — тренер сразу увидит отчёт"
      actions={
        <Button size="sm" className="text-xs h-9 gap-1.5 shadow-sm" asChild>
          <Link href="/trainee/workout/new">
            <PlusCircle className="h-4 w-4" /> Заполнить тренировку
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Link coach banner */}
        {noCoach && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm flex items-center gap-1.5 text-primary">
                <UserCheck className="h-4 w-4" /> Подключитесь к своему тренеру
              </p>
              <p className="text-xs text-muted-foreground">
                Попросите тренера дать код приглашения и введите его во вкладке «Тренеры»
              </p>
            </div>
            <Button size="sm" className="text-xs h-9" asChild>
              <Link href="/trainee/coaches">Ввести код</Link>
            </Button>
          </div>
        )}

        {/* KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Всего тренировок"
            value={isLoading ? "—" : stats?.totalWorkouts ?? 0}
            subtitle="в истории"
            icon={<Dumbbell className="h-5 w-5" />}
          />
          <StatCard
            title="Общий тоннаж"
            value={
              isLoading
                ? "—"
                : stats?.totalVolume
                ? `${stats.totalVolume.toLocaleString("ru-RU")} кг`
                : 0
            }
            subtitle="поднятый вес"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Средний сон"
            value={isLoading ? "—" : stats?.avgSleep ? `${stats.avgSleep} ч` : "—"}
            subtitle="перед тренировками"
            icon={<Moon className="h-5 w-5" />}
          />
          <StatCard
            title="Динамика веса"
            value={
              stats?.weightDelta !== null && stats?.weightDelta !== undefined
                ? `${stats.weightDelta > 0 ? "+" : ""}${stats.weightDelta} кг`
                : "—"
            }
            subtitle={
              stats?.initialWeight && stats?.currentWeight
                ? `с ${stats.initialWeight} до ${stats.currentWeight} кг`
                : "заполните замеры"
            }
            icon={<Scale className="h-5 w-5" />}
          />
        </div>

        {/* Latest AI report highlight */}
        {lastAi && last && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                ИИ-анализ последней тренировки
              </h2>
              <RiskBadge level={lastAi.riskLevel as any} size="sm" />
            </div>

            <Card className="hover:shadow-md transition-all border-primary/20">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm sm:text-base">{last.workout.title}</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(last.workout.workoutDate).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                    <Link href={`/trainee/workout/${last.workout.id}`}>
                      Открыть полный отчёт <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    Самочувствие: <b>{last.workout.wellness}/10</b>
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    Сон: <b>{last.workout.sleepHours} ч</b>
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    Объём: <b>{Math.round(Number(last.workout.totalVolume)).toLocaleString("ru-RU")} кг</b>
                  </span>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Сводка ИИ</span>
                  </div>
                  <p className="text-muted-foreground">{lastAi.summary}</p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent workouts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold">Недавние тренировки</h2>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/trainee/history">Вся история →</Link>
            </Button>
          </div>

          {workouts && workouts.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-xs text-muted-foreground space-y-2">
                <Dumbbell className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p>Тренировок ещё нет</p>
                <Button size="sm" className="text-xs" asChild>
                  <Link href="/trainee/workout/new">Заполнить первую тренировку</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workouts?.map(({ workout: w, aiReport: ai }) => (
                <Card key={w.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base">{w.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(w.workoutDate).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ai && <RiskBadge level={ai.riskLevel as any} size="sm" />}
                        <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                          <Link href={`/trainee/workout/${w.id}`}>Отчёт ИИ →</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        Самочувствие: <b>{w.wellness}/10</b>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        Сон: <b>{w.sleepHours} ч</b>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        Объём: <b>{Math.round(Number(w.totalVolume)).toLocaleString("ru-RU")} кг</b>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-medium">
                        {w.totalSets} подх. • {w.totalReps} повт.
                      </span>
                    </div>
                    {w.notes && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                        «{w.notes}»
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
