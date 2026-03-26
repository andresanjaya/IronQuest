import { RouterProvider } from 'react-router';
import { router } from './routes';
import { WorkoutProvider } from './context/WorkoutContext';
import { AuthProvider } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';

export default function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <WorkoutProvider>
          <RouterProvider router={router} />
        </WorkoutProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}
