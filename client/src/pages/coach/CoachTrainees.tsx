import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Search, MoreVertical, QrCode, ArrowRight, Clock, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export default function CoachTrainees() {
  const { data: trainees, isLoading, refetch } = trpc.coach.listTrainees.useQuery();
  const [search, setSearch] = useState("");

  const setStatus = trpc.coach.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Статус обновлён");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = trainees?.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.trainee.name && t.trainee.name.toLowerCase().includes(q)) ||
      (t.trainee.phone && t.trainee.phone.toLowerCase().includes(q)) ||
      (t.trainee.username && t.trainee.username.toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout
      title="Подопечные"
      subtitle="Список всех учеников с антропометрией и статусом активности"
      actions={
        <Button size="sm" className="text-xs h-9 gap-1.5" asChild>
          <Link href="/coach/codes">
            <QrCode className="h-4 w-4" />
            Код для ученика
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filtered && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-xs text-muted-foreground space-y-2">
            <p>Ученики не найдены</p>
            <Button size="sm" variant="outline" className="text-xs" asChild>
              <Link href="/coach/codes">
                <PlusCircle className="h-3.5 w-3.5 mr-1" /> Создать код подключения
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered?.map((t) => {
              const tr = t.trainee;
              const ai = t.lastAiReport;
              const lastW = t.lastWorkout;
              const delta = t.weightDelta;
              const m = t.latestMeasurement;
              const statusLabels: Record<string, string> = {
                active: "Активен",
                paused: "Пауза",
                archived: "Архив",
              };
              return (
                <Card key={tr.id} className="hover:shadow-md transition-all hover:border-primary/40">
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {tr.name ? tr.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{tr.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{tr.phone || tr.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {statusLabels[t.link.status] || t.link.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => setStatus.mutate({ traineeId: tr.id, status: "active" })}
                            >
                              Сделать активным
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStatus.mutate({ traineeId: tr.id, status: "paused" })}
                            >
                              Поставить на паузу
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setStatus.mutate({ traineeId: tr.id, status: "archived" })}
                              className="text-destructive focus:text-destructive"
                            >
                              В архив
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Anthropometry row */}
                    <div className="grid grid-cols-4 gap-1 text-center text-xs bg-muted/40 rounded-lg p-2">
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
                      <div>
                        <p className="text-[10px] text-muted-foreground">Цель</p>
                        <p className="font-bold">{tr.targetWeight ? `${tr.targetWeight} кг` : "—"}</p>
                      </div>
                    </div>

                    {/* Waist & fat if measured */}
                    {(m?.waist || m?.bodyFat) && (
                      <p className="text-[11px] text-muted-foreground">
                        Замеры: {m.waist ? `талия ${m.waist} см` : ""}{m.waist && m.bodyFat ? ", " : ""}{m.bodyFat ? `жир ${m.bodyFat}%` : ""}
                      </p>
                    )}

                    {/* Last workout + risk */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                      {lastW ? (
                        <span className="truncate">
                          Последняя: <b>{lastW.title}</b>
                        </span>
                      ) : (
                        <span>Тренировок ещё нет</span>
                      )}
                      {ai && <RiskBadge level={ai.riskLevel as any} size="sm" />}
                    </div>

                    <Button size="sm" className="w-full text-xs h-8 gap-1.5" asChild>
                      <Link href={`/coach/trainees/${tr.id}`}>
                        Открыть карточку <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
