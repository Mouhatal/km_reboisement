'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Users, Shield, UserCheck, X } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card'; // Import StatCard
import { format } from 'date-fns'; // Import format for date formatting

export default function AdministrationPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (!loading && user && profile?.role !== 'administrateur') {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'administrateur') {
      loadProfiles();
    }
  }, [user, profile]);

  const loadProfiles = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProfiles(data);
    }
    setLoadingData(false);
  };

  if (loading || !user || profile?.role !== 'administrateur') {
    return null;
  }

  const stats = {
    total: profiles.length,
    administrateurs: profiles.filter(p => p.role === 'administrateur').length,
    enqueteurs: profiles.filter(p => p.role === 'enqueteur').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">Gestion des utilisateurs et paramètres système</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Utilisateurs"
            value={stats.total}
            icon={Users}
            bgColor="bg-green-100"
            textColor="text-green-800"
            iconColor="text-green-600"
          />
          <StatCard
            title="Administrateurs"
            value={stats.administrateurs}
            icon={Shield}
            bgColor="bg-blue-100"
            textColor="text-blue-800"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Enquêteurs"
            value={stats.enqueteurs}
            icon={UserCheck}
            bgColor="bg-orange-100"
            textColor="text-orange-800"
            iconColor="text-orange-600"
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Liste des Utilisateurs</h2>
          </div>

          <div className="p-4">
            {loadingData ? (
              <div className="text-center py-12">Chargement...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucun utilisateur</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom complet</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rôle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date création</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profiles.map((prof) => (
                      <tr key={prof.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{prof.full_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{prof.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            prof.role === 'administrateur'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {prof.role === 'administrateur' ? 'Administrateur' : 'Enquêteur'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(prof.created_at), 'dd/MM/yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}