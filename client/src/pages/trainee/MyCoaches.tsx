import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserCheck, QrCode, Loader2, Sparkles, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export default function MyCoaches() {
  const { data: coaches, isLoading, refetch } = trpc.trainee.myCoaches.useQuery();
  const [code, setCode] = useState("");

  const link = trpc.trainee.linkCoach.useMutation({
    onSuccess: (data) => {
      toast.success(`Вы подключены к тренеру: ${data.coach.name}`);
      setCode("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    link.mutate({ code: code.trim().toUpperCase() });
  };

  return (
    <AppLayout
      title="Мои тренеры"
      subtitle="Подключитесь к тренеру по коду приглашения — он получит доступ к вашим отчётам"
    >
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Code form */}
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Ввести код приглашения тренера
            </CardTitle>
            <CardDescription className="text-xs">
              Формат кода обычно <code>FP-XXX-XXXX</code> — попросите его у вашего тренера
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLink} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs">
                  Код подключения
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="FP-742-WK9X"
                  className="font-mono text-base tracking-widest uppercase h-11 text-center font-bold"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-xs sm:text-sm" disabled={link.isPending}>
                {link.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Подключиться к тренеру"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Connected coaches */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" /> Подключённые тренеры
          </h2>

          {isLoading ? (
            <div className="h-28 rounded-xl bg-muted/40 animate-pulse" />
          ) : coaches && coaches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <p>Вы пока не подключены ни к одному тренеру</p>
                <p>Введите код выше — тренер сразу увидит все ваши тренировки на своём дашборде</p>
              </CardContent>
            </Card>
          ) : (
            coaches?.map(({ coach, link: l }) => (
              <Card key={coach.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0">
                        {coach.name ? coach.name.charAt(0).toUpperCase() : "T"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base">{coach.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {l.status === "active" ? "Активен" : l.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">@{coach.username}</p>
                      </div>
                    </div>
                  </div>

                  {coach.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg">
                      {coach.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-2">
                    {coach.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {coach.phone}
                      </span>
                    )}
                    {coach.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {coach.email}
                      </span>
                    )}
                    <span>
                      Подключён:{" "}
                      {new Date(l.linkedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </AppLayout>
  );
}
