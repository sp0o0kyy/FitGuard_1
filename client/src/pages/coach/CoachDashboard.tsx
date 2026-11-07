import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Flame,
  Moon,
  Heart,
  QrCode,
  ArrowRight,
  Brain,
  PlusCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function CoachDashboard() {
  const { data, isLoading } = trpc.coach.getDashboard.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: trainees } = trpc.coach.listTrainees.useQuery();
  const { data: codes } = trpc.coach.listInviteCodes.useQuery();

  const activeCode = codes?.find((c) => c.isActive);

  return (
    <AppLayout
      title="Дашборд тренера"
      subtitle="Аналитическая сводка по всем подопечным в реальном времени"
      actions={
        <Button size="sm" className="text-xs h-9 gap-1.5" asChild>
          <Link href="/coach/codes">
            <QrCode className="h-4 w-4" />
            Код для ученика
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Подопечных"
            value={isLoading ? "—" : data?.totalTrainees ?? 0}
            subtitle="активных связок"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Тренировок за 7 дней"
            value={isLoading ? "—" : data?.workoutsThisWeek ?? 0}
            subtitle="новых отчётов"
            icon={<Flame className="h-5 w-5" />}
          />
          <StatCard
            title="Сигналов риска"
            value={isLoading ? "—" : data?.riskAlerts ?? 0}
            subtitle="в последних отчётах"
            icon={<Heart className="h-5 w-5" />}
          />
          <StatCard
            title="Активный код"
            value={activeCode ? activeCode.code : "—"}
            subtitle={activeCode ? `использован ${activeCode.usesCount} раз` : "создайте для привязки"}
            icon={<QrCode className="h-5 w-5" />}
          />
        </div>

        {/* Invite code banner if none */}
        {!activeCode && (
          <div className="rounded-2xl border border-dashed p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/30">
            <div>
              <p className="font-semibold text-sm">Ученики ещё не подключены</p>
              <p className="text-xs text-muted-foreground">
                Сгенерируйте код приглашения и отправьте его подопечным — они введут его в приложении
              </p>
            </div>
            <Button size="sm" className="text-xs h-9 gap-1.5" asChild>
              <Link href="/coach/codes">
                <PlusCircle className="h-4 w-4" /> Создать код
              </Link>
            </Button>
          </div>
        )}

        {/* Trainees quick cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Подопечные
            </h2>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/coach/trainees">Все карточки →</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : trainees && trainees.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground space-y-2">
              <p>Пока нет подключённых учеников</p>
              <p>Отправьте подопечным ваш код приглашения для мгновенной привязки</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trainees?.map((t) => {
                const tr = t.trainee;
                const ai = t.lastAiReport;
                const lastW = t.lastWorkout;
                const delta = t.weightDelta;
                return (
                  <Card
                    key={tr.id}
                    className="hover:shadow-md transition-all hover:border-primary/40 overflow-hidden"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                            {tr.name ? tr.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{tr.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{tr.phone || tr.username}</p>
                          </div>
                        </div>
                        {ai && <RiskBadge level={ai.riskLevel as any} size="sm" />}
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs bg-muted/40 rounded-lg p-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Вес</p>
                          <p className="font-bold">{t.currentWeight ? `${t.currentWeight} кг` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Рост</p>
                          <p className="font-bold">{tr.heightCm ? `${tr.heightCm} см` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Динамика</p>
                          <p
                            className={`font-bold ${
                              delta !== null && delta < 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : delta !== null && delta > 0
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {delta !== null ? `${delta > 0 ? "+" : ""}${delta} кг` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Last workout note */}
                      {lastW && (
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <p className="truncate">
                            Последняя: <b>{lastW.title}</b> • сон {lastW.sleepHours} ч • с/ч {lastW.wellness}/10
                          </p>
                          <p className="flex items-center gap-1 text-[10px]">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(parseISO(new Date(lastW.workoutDate).toISOString()), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </p>
                        </div>
                      )}

                      <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5" asChild>
                        <Link href={`/coach/trainees/${tr.id}`}>
                          Открыть аналитику <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent workouts feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Последние тренировки и выводы ИИ
            </h2>
            <span className="text-xs text-muted-foreground">обновляется автоматически</span>
          </div>

          <div className="space-y-3">
            {data?.recentWorkouts.map((r) => {
              const w = r.workout;
              const ai = r.aiReport;
              const tr = r.trainee;
              return (
                <Card key={w.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {tr.name ? tr.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{tr.name}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-semibold">{w.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(w.workoutDate).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {ai && <RiskBadge level={ai.riskLevel} size="sm" />}
                        <Button size="sm" variant="ghost" className="text-xs h-8" asChild>
                          <Link href={`/trainee/workout/${w.id}`}>Отчёт →</Link>
                        </Button>
                      </div>
                    </div>

                    {/* Chips */}
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
                      {w.bodyWeight && (
                        <span className="rounded-md bg-muted px-2 py-1 font-medium">
                          Вес: <b>{w.bodyWeight} кг</b>
                        </span>
                      )}
                    </div>

                    {/* AI summary */}
                    {ai && (
                      <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs leading-relaxed space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Вывод ИИ</span>
                        </div>
                        <p className="text-muted-foreground">{ai.summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
