'use client';

import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Pendant le chargement, ne rien afficher
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Chargement...</div>
    </div>;
  }

  // Si pas d'utilisateur (page de login), pas de navigation
  if (!user) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Si utilisateur connecté, afficher la navigation
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
