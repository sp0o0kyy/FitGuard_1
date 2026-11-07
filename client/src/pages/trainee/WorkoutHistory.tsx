import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Dumbbell, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutHistory() {
  const { data: workouts, isLoading, refetch } = trpc.trainee.listWorkouts.useQuery();

  const del = trpc.trainee.deleteWorkout.useMutation({
    onSuccess: () => {
      toast.success("Тренировка удалена");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppLayout
      title="История тренировок"
      subtitle="Все ваши заполненные журналы и ИИ-отчёты"
      actions={
        <Button size="sm" className="text-xs h-9 gap-1.5" asChild>
          <Link href="/trainee/workout/new">
            <PlusCircle className="h-4 w-4" /> Новая тренировка
          </Link>
        </Button>
      }
    >
      <div className="space-y-3 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : workouts && workouts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="text-sm">История пуста</p>
              <Button size="sm" className="text-xs" asChild>
                <Link href="/trainee/workout/new">Заполнить первую тренировку</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          workouts?.map(({ workout: w, aiReport: ai }) => (
            <Card key={w.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base">{w.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(w.workoutDate).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ai && <RiskBadge level={ai.riskLevel as any} size="sm" />}
                    <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                      <Link href={`/trainee/workout/${w.id}`}>ИИ-отчёт →</Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm("Удалить эту тренировку и её ИИ-отчёт?")) {
                          del.mutate({ workoutId: w.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
          ))
        )}
      </div>
    </AppLayout>
  );
}
