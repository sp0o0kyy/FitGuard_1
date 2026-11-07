import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Scale, Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Profile() {
  const { user, refresh, isCoach, isTrainee } = useAuthContext();
  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Профиль сохранён");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : "");
  const [initialWeight, setInitialWeight] = useState(user?.initialWeight ? String(user.initialWeight) : "");
  const [currentWeight, setCurrentWeight] = useState(user?.currentWeight ? String(user.currentWeight) : "");
  const [targetWeight, setTargetWeight] = useState(user?.targetWeight ? String(user.targetWeight) : "");
  const [notes, setNotes] = useState(user?.notes || "");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setHeightCm(user.heightCm ? String(user.heightCm) : "");
      setInitialWeight(user.initialWeight ? String(user.initialWeight) : "");
      setCurrentWeight(user.currentWeight ? String(user.currentWeight) : "");
      setTargetWeight(user.targetWeight ? String(user.targetWeight) : "");
      setNotes(user.notes || "");
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      heightCm: heightCm ? Number(heightCm) : null,
      initialWeight: initialWeight ? Number(initialWeight) : null,
      currentWeight: currentWeight ? Number(currentWeight) : null,
      targetWeight: targetWeight ? Number(targetWeight) : null,
      notes: notes.trim() || undefined,
    });
  };

  const initial = user?.initialWeight ? Number(user.initialWeight) : null;
  const curr = user?.currentWeight ? Number(user.currentWeight) : null;
  const delta = initial !== null && curr !== null ? Number((curr - initial).toFixed(1)) : null;

  return (
    <AppLayout
      title="Профиль и антропометрия"
      subtitle="Управляйте личными данными и базовыми параметрами тела"
    >
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Role card */}
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="font-bold text-base">{user?.name || "Пользователь"}</p>
                <p className="text-xs text-muted-foreground">@{user?.username}</p>
              </div>
            </div>
            <Badge className="text-xs px-2.5 py-1">
              {isCoach ? "Тренер" : isTrainee ? "Ученик" : "Администратор"}
            </Badge>
          </CardContent>
        </Card>

        {/* Delta chip for trainee */}
        {isTrainee && (
          <div className="rounded-xl border bg-muted/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span>
                Динамика относительно старта ({user?.initialWeight || "—"} кг):
              </span>
            </div>
            <b
              className={`text-sm ${
                delta !== null && delta < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : delta !== null && delta > 0
                  ? "text-amber-600"
                  : "text-muted-foreground"
              }`}
            >
              {delta !== null ? `${delta > 0 ? "+" : ""}${delta} кг` : "заполните замеры"}
            </b>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal */}
          <Card>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Личные данные
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pn" className="text-xs">
                  Имя и фамилия
                </Label>
                <Input
                  id="pn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pe" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="pe"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pp" className="text-xs">
                    Телефон
                  </Label>
                  <Input
                    id="pp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (900) 000-00-00"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anthropometry defaults (especially for trainee) */}
          <Card>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> Базовые параметры тела
              </CardTitle>
              <CardDescription className="text-xs">
                Эти данные отображаются тренеру в карточке ученика
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="h" className="text-xs">
                    Рост, см
                  </Label>
                  <Input
                    id="h"
                    type="number"
                    min="100"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="182"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="iw" className="text-xs">
                    Стартовый вес, кг
                  </Label>
                  <Input
                    id="iw"
                    type="number"
                    step="0.1"
                    value={initialWeight}
                    onChange={(e) => setInitialWeight(e.target.value)}
                    placeholder="84.5"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cw" className="text-xs">
                    Текущий вес, кг
                  </Label>
                  <Input
                    id="cw"
                    type="number"
                    step="0.1"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    placeholder="82.3"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tw" className="text-xs">
                    Целевой вес, кг
                  </Label>
                  <Input
                    id="tw"
                    type="number"
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="80.0"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label htmlFor="n" className="text-xs">
                  {isCoach ? "О себе / описание специализации" : "Цели, особенности, травмы"}
                </Label>
                <Textarea
                  id="n"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder={
                    isCoach
                      ? "Специализация, опыт, сертификаты..."
                      : "Цель: рекомпозиция, старая травма колена..."
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-11 text-xs sm:text-sm" disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить профиль"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
