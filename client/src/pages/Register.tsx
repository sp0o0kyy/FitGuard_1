import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, LayoutDashboard, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuthContext();
  const [role, setRole] = useState<"trainee" | "coach">("trainee");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Укажите имя");
    if (!username.trim()) return setError("Укажите логин");
    if (password.length < 4) return setError("Пароль не менее 4 символов");
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim() ? email.trim() : undefined,
        password,
        role,
        phone: phone.trim() ? phone.trim() : undefined,
      });
      toast.success("Регистрация успешна!");
      navigate(role === "coach" ? "/coach/dashboard" : "/trainee/dashboard");
    } catch (err: any) {
      setError(err?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm">
            <Dumbbell className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            FitGuard
          </span>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Создайте аккаунт и начните мониторинг тренировок
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Регистрация</CardTitle>
          <CardDescription className="text-xs">
            Выберите вашу роль — интерфейс настроится автоматически
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Role picker */}
            <div className="space-y-1.5">
              <Label className="text-xs">Кто вы в системе? *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("trainee")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer relative",
                    role === "trainee"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {role === "trainee" && (
                    <span className="absolute top-2 right-2 rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <Dumbbell className="h-6 w-6 mb-1" />
                  <span className="font-bold text-xs sm:text-sm">Ученик</span>
                  <span className="text-[10px] text-muted-foreground">заполняю тренировки</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("coach")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer relative",
                    role === "coach"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  {role === "coach" && (
                    <span className="absolute top-2 right-2 rounded-full bg-primary text-primary-foreground p-0.5">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <LayoutDashboard className="h-6 w-6 mb-1" />
                  <span className="font-bold text-xs sm:text-sm">Тренер</span>
                  <span className="text-[10px] text-muted-foreground">веду подопечных</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Имя и фамилия *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Петров"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="un" className="text-xs">
                Логин *
              </Label>
              <Input
                id="un"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ivan"
                required
                pattern="^[a-zA-Z0-9_.-]+$"
              />
              <p className="text-[11px] text-muted-foreground">Латиница, цифры, дефис и точка</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="em" className="text-xs">
                Email
              </Label>
              <Input
                id="em"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ivan@fitguard.ru"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ph" className="text-xs">
                Телефон
              </Label>
              <Input
                id="ph"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (900) 000-00-00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pw" className="text-xs">
                Пароль *
              </Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Зарегистрироваться"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
