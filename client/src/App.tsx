import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachTrainees from "./pages/coach/CoachTrainees";
import CoachTraineeDetail from "./pages/coach/CoachTraineeDetail";
import CoachCodes from "./pages/coach/CoachCodes";
import TraineeDashboard from "./pages/trainee/TraineeDashboard";
import WorkoutForm from "./pages/trainee/WorkoutForm";
import WorkoutDetail from "./pages/trainee/WorkoutDetail";
import WorkoutHistory from "./pages/trainee/WorkoutHistory";
import Measurements from "./pages/trainee/Measurements";
import MyCoaches from "./pages/trainee/MyCoaches";
import Profile from "./pages/Profile";

function HomeRedirect() {
  const { user, isCoach } = useAuthContext();
  if (user) {
    return <Redirect to={isCoach ? "/coach/dashboard" : "/trainee/dashboard"} />;
  }
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Coach routes */}
      <Route path="/coach" component={() => <Redirect to="/coach/dashboard" />} />
      <Route path="/coach/dashboard" component={CoachDashboard} />
      <Route path="/coach/trainees/:id" component={CoachTraineeDetail} />
      <Route path="/coach/trainees" component={CoachTrainees} />
      <Route path="/coach/codes" component={CoachCodes} />

      {/* Trainee routes */}
      <Route path="/trainee" component={() => <Redirect to="/trainee/dashboard" />} />
      <Route path="/trainee/dashboard" component={TraineeDashboard} />
      <Route path="/trainee/workout/new" component={WorkoutForm} />
      <Route path="/trainee/workout/:id" component={WorkoutDetail} />
      <Route path="/trainee/history" component={WorkoutHistory} />
      <Route path="/trainee/measurements" component={Measurements} />
      <Route path="/trainee/coaches" component={MyCoaches} />

      {/* Shared routes */}
      <Route path="/profile" component={Profile} />

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
