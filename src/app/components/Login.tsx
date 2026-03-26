import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const response = isSignUpMode ? await signUp(email, password) : await signIn(email, password);

    if (response.error) {
      setError(response.error);
    } else if (isSignUpMode) {
      setMessage('Account created. Check your email if confirmation is required, then log in.');
      setIsSignUpMode(false);
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Dumbbell className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black">IronQuest</h1>
            <p className="text-slate-400 text-sm">Login untuk sync favorites dan program</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2.5 text-white outline-none focus:border-orange-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2.5 text-white outline-none focus:border-orange-500"
              placeholder="Minimum 6 karakter"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-emerald-400 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-bold transition-all"
          >
            {submitting || loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </span>
            ) : isSignUpMode ? (
              'Create account'
            ) : (
              'Login'
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUpMode((prev) => !prev);
            setError(null);
            setMessage(null);
          }}
          className="mt-4 text-sm text-slate-300 hover:text-white underline underline-offset-2"
        >
          {isSignUpMode ? 'Sudah punya akun? Login' : 'Belum punya akun? Register'}
        </button>
      </motion.div>
    </div>
  );
}
