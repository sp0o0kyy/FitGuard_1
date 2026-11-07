import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, LayoutDashboard, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, demoLogin } = useAuthContext();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      toast.success("Вход выполнен");
      // Read refreshed user from location after short tick or let context handle
      setTimeout(() => {
        try {
          const raw = localStorage.getItem("manus-runtime-user-info");
          const u = raw ? JSON.parse(raw) : null;
          navigate(u?.role === "coach" ? "/coach/dashboard" : "/trainee/dashboard");
        } catch {
          navigate("/coach/dashboard");
        }
      }, 50);
    } catch (err: any) {
      setError(err?.message || "Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: "coach" | "trainee") => {
    try {
      setLoading(true);
      await demoLogin(role);
      toast.success(role === "coach" ? "Вошли как тренер Анна" : "Вошли как ученик Иван");
      navigate(role === "coach" ? "/coach/dashboard" : "/trainee/dashboard");
    } catch (err: any) {
      setError(err?.message || "Ошибка демо-входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm">
            <Dumbbell className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            FitGuard
          </span>
        </Link>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Войдите в личный кабинет тренера или ученика
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Вход</CardTitle>
          <CardDescription className="text-xs">
            Логин или email и пароль
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="id" className="text-xs">
                Логин или email
              </Label>
              <Input
                id="id"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="coach или ivan@fitguard.ru"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd" className="text-xs">
                Пароль
              </Label>
              <Input
                id="pwd"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Войти"}
            </Button>
          </form>

          <div className="relative my-5 text-center text-xs text-muted-foreground">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <span className="relative bg-card px-2">или быстрый демо-вход</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5"
              onClick={() => handleDemo("coach")}
              disabled={loading}
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              Тренер Анна
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5"
              onClick={() => handleDemo("trainee")}
              disabled={loading}
            >
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              Ученик Иван
            </Button>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Ещё нет аккаунта?{" "}
            <Link href="/register" className="font-semibold text-primary underline underline-offset-2">
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed p-3.5 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Тестовые учётные записи
        </p>
        <p>Тренер: <code>coach</code> / <code>coach123</code></p>
        <p>Ученик: <code>ivan</code> / <code>ivan123</code> (Мария: <code>maria</code> / <code>maria123</code>)</p>
      </div>
    </div>
  );
}
