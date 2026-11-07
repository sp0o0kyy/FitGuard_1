import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  QrCode,
  PlusCircle,
  History,
  Scale,
  UserCheck,
  User,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, title, subtitle, actions, hideNav = false }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, isCoach, logout, demoLogin } = useAuthContext();
  const { theme, toggleTheme } = useTheme();

  const coachNav = [
    { href: "/coach/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/coach/trainees", label: "Подопечные", icon: Users },
    { href: "/coach/codes", label: "Коды", icon: QrCode },
  ];

  const traineeNav = [
    { href: "/trainee/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/trainee/workout/new", label: "Новая тренировка", icon: PlusCircle },
    { href: "/trainee/history", label: "История", icon: History },
    { href: "/trainee/measurements", label: "Замеры", icon: Scale },
    { href: "/trainee/coaches", label: "Тренеры", icon: UserCheck },
  ];

  const navItems = isCoach ? coachNav : traineeNav;

  const roleLabel = isCoach ? "Тренер" : "Ученик";

  const handleDemoSwitch = async (targetRole: "coach" | "trainee") => {
    try {
      await demoLogin(targetRole);
      toast.success(
        targetRole === "coach" ? "Вошли как тренер Анна" : "Вошли как ученик Иван"
      );
      navigate(targetRole === "coach" ? "/coach/dashboard" : "/trainee/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Ошибка демо-входа");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href={user ? (isCoach ? "/coach/dashboard" : "/trainee/dashboard") : "/"}
            className="flex items-center gap-2 group"
          >
            <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight leading-none bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                FitGuard
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:inline">
                Аналитика тренировок
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          {user && !hideNav && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((it) => {
                const Icon = it.icon;
                const active = location === it.href || location.startsWith(it.href + "/");
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Demo quick switch */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1 px-2 border-dashed hidden xs:inline-flex"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span className="hidden sm:inline">Демо:</span>
                    <span className="font-semibold">{roleLabel}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 text-xs">
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                    Быстрое переключение ролей
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleDemoSwitch("coach")}>
                    Тренер (Анна Смирнова) — видеть дашборд
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDemoSwitch("trainee")}>
                    Ученик (Иван Петров) — заполнять журнал
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTheme}
              aria-label="Сменить тему"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User menu or login CTA */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 text-xs">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="hidden md:inline font-medium max-w-[120px] truncate">
                      {user.name || user.username}
                    </span>
                    <Badge variant="secondary" className="text-[10px] hidden sm:inline px-1.5 py-0">
                      {roleLabel}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 text-xs">
                  <DropdownMenuLabel>
                    <div className="font-medium truncate">{user.name || user.username}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{user.email || user.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Профиль и замеры
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDemoSwitch(isCoach ? "trainee" : "coach")}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Переключить на {isCoach ? "ученика (Иван)" : "тренера (Анна)"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout().then(() => navigate("/login"));
                    }}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
                  <Link href="/login">Войти</Link>
                </Button>
                <Button size="sm" className="text-xs h-8" asChild>
                  <Link href="/register">Регистрация</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page header (if provided) */}
      {(title || actions) && (
        <section className="border-b bg-muted/20">
          <div className="container py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {title && <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>}
              {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>
        </section>
      )}

      {/* Main content */}
      <main className="container flex-1 py-4 sm:py-6 pb-20 md:pb-6">{children}</main>

      {/* Mobile bottom navigation bar */}
      {user && !hideNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="grid grid-cols-5 h-16 text-[10px]">
            {navItems.map((it) => {
              const Icon = it.icon;
              const active = location === it.href || location.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors relative",
                    active ? "font-bold text-primary" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl p-1 transition-all",
                      active && "bg-primary/10"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="max-w-[72px] text-center text-[9px] leading-3 whitespace-normal">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
