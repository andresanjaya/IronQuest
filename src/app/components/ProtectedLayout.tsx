import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

export function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-slate-300">
        <Loader2 size={24} className="animate-spin mr-2" />
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}
