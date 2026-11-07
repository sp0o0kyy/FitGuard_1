import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { InviteCodeCard } from "@/components/InviteCodeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode, PlusCircle, ArrowLeft, Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function CoachCodes() {
  const { data: codes, isLoading, refetch } = trpc.coach.listInviteCodes.useQuery();
  const [open, setOpen] = useState(false);
  const [maxUses, setMaxUses] = useState<string>("");
  const [days, setDays] = useState<string>("60");

  const createCode = trpc.coach.createInviteCode.useMutation({
    onSuccess: (code) => {
      toast.success(`Код создан: ${code.code}`);
      setOpen(false);
      setMaxUses("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivate = trpc.coach.deactivateInviteCode.useMutation({
    onSuccess: () => {
      toast.success("Код деактивирован");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCode.mutate({
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresInDays: days ? Number(days) : undefined,
    });
  };

  return (
    <AppLayout
      title="Коды приглашений"
      subtitle="Генерируйте уникальные коды — ученик вводит код в своём кабинете для привязки"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs h-9 gap-1.5">
              <PlusCircle className="h-4 w-4" /> Новый код
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Создать код подключения</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="max" className="text-xs">
                  Максимум использований (необязательно)
                </Label>
                <Input
                  id="max"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="например, 5 или оставьте пустым"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="days" className="text-xs">
                  Срок действия, дней
                </Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="60"
                  className="h-9 text-xs"
                />
              </div>
              <Button type="submit" className="w-full h-10 text-xs" disabled={createCode.isPending}>
                {createCode.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Сгенерировать код"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Helper banner */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Как это работает</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
            <li>Создайте код с ограничением по числу активаций или сроку.</li>
            <li>Отправьте код ученику (Telegram, WhatsApp, email).</li>
            <li>Ученик открывает FitGuard → вкладка <b>«Тренеры»</b> → вводит код.</li>
            <li>Ученик мгновенно появляется у вас в списке подопечных и на дашборде.</li>
          </ol>
        </div>

        {/* Codes grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : codes && codes.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-xs text-muted-foreground space-y-2">
              <QrCode className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p>Вы ещё не создали ни одного кода</p>
              <Button size="sm" className="text-xs" onClick={() => setOpen(true)}>
                Создать первый код
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {codes?.map((c) => (
              <InviteCodeCard
                key={c.id}
                code={c.code}
                isActive={Boolean(c.isActive)}
                usesCount={c.usesCount}
                maxUses={c.maxUses}
                expiresAt={c.expiresAt}
                showManage
                onDeactivate={() => deactivate.mutate({ codeId: c.id })}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
