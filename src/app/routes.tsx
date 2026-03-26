import { createBrowserRouter } from "react-router";
import { Dashboard } from "./components/Dashboard";
import { ActiveWorkout } from "./components/ActiveWorkout";
import { SkillTree } from "./components/SkillTree";
import { History } from "./components/History";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import { Login } from "./components/Login";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { Favorites } from "./components/Favorites";
import { Programs } from "./components/Programs";
import { ProgramDetail } from "./components/ProgramDetail";
import { ExerciseDetail } from "./components/ExerciseDetail";
import { TrainingCalendar } from "./components/TrainingCalendar";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "workout", Component: ActiveWorkout },
      { path: "skills", Component: SkillTree },
      { path: "calendar", Component: TrainingCalendar },
      { path: "history", Component: History },
      { path: "exercises", Component: ExerciseLibrary },
      { path: "exercises/:exerciseId", Component: ExerciseDetail },
      { path: "favorites", Component: Favorites },
      { path: "programs", Component: Programs },
      { path: "programs/:id", Component: ProgramDetail },
    ],
  },
]);