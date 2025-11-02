'use client';

import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/components/login-form';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  // Si l'utilisateur est connecté et que le chargement est terminé, nous sommes en attente de redirection.
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirection vers le tableau de bord...</div>
      </div>
    );
  }

  return <LoginForm />;
}