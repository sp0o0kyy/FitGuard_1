import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { AiReportCard } from "@/components/AiReportCard";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Dumbbell, Moon, Heart, Scale, Clock, Brain } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function WorkoutDetail() {
  const params = useParams<{ id: string }>();
  const workoutId = Number(params.id);
  const { isCoach } = useAuthContext();

  const { data, isLoading, refetch } = trpc.trainee.getWorkout.useQuery(
    { workoutId },
    { enabled: Number.isFinite(workoutId) }
  );

  if (isLoading || !data) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
          Загрузка отчёта...
        </div>
      </AppLayout>
    );
  }

  const { workout, aiReport, trainee } = data;
  let exercises: any[] = [];
  try {
    exercises = JSON.parse(workout.exercises);
  } catch {}

  const backHref = isCoach && trainee ? `/coach/trainees/${trainee.id}` : "/trainee/history";

  return (
    <AppLayout
      title={workout.title}
      subtitle={
        (trainee ? `Ученик: ${trainee.name} • ` : "") +
        new Date(workout.workoutDate).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      }
      actions={
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-3.5 w-3.5" /> Назад
          </Link>
        </Button>
      }
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* KPI chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Brain className="h-3 w-3 text-primary" /> Самочувствие
            </p>
            <p className="font-bold text-lg">{workout.wellness}/10</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Moon className="h-3 w-3 text-indigo-500" /> Сон
            </p>
            <p className="font-bold text-lg">{workout.sleepHours} ч</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Dumbbell className="h-3 w-3 text-primary" /> Тоннаж
            </p>
            <p className="font-bold text-lg">
              {Math.round(Number(workout.totalVolume)).toLocaleString("ru-RU")} кг
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground">Подходы / повторы</p>
            <p className="font-bold text-lg">
              {workout.totalSets} / {workout.totalReps}
            </p>
          </div>
        </div>

        {/* Optional metrics row */}
        {(workout.heartRate || workout.bodyWeight || workout.durationMinutes) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {workout.heartRate && (
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" /> Пульс {workout.heartRate} уд/мин
              </span>
            )}
            {workout.bodyWeight && (
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium flex items-center gap-1">
                <Scale className="h-3 w-3 text-primary" /> Вес {workout.bodyWeight} кг
              </span>
            )}
            {workout.durationMinutes && (
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> {workout.durationMinutes} мин
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {workout.notes && (
          <div className="rounded-xl border-l-4 border-primary bg-muted/40 p-4 text-xs space-y-1">
            <p className="font-semibold text-muted-foreground">Заметки ученика</p>
            <p className="leading-relaxed">«{workout.notes}»</p>
          </div>
        )}

        {/* Exercises */}
        <Card>
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-sm sm:text-base">Выполненная программа</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            {exercises.map((ex: any, idx: number) => (
              <div key={idx} className="rounded-xl border p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{ex.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {ex.sets?.length} подх.
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(ex.sets || []).map((s: any, sIdx: number) => (
                    <span
                      key={sIdx}
                      className={`px-2 py-1 rounded-md border font-mono ${
                        s.isWarmup ? "bg-muted text-muted-foreground line-through decoration-dotted" : "bg-card font-bold"
                      }`}
                    >
                      {s.weight} кг × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Report */}
        {aiReport ? (
          <AiReportCard report={aiReport} workoutId={workout.id} onRefresh={refetch} />
        ) : (
          <Card>
            <CardContent className="p-10 text-center text-xs text-muted-foreground">
              ИИ-отчёт формируется...
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
