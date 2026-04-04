'use client';

import { useAuth } from '@/lib/auth';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[rgb(var(--muted-foreground))] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) return <LoginPage />;
  return <Dashboard />;
}
