'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Users, Shield, UserCheck, X } from 'lucide-react';

export default function AdministrationPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (!loading && profile?.role !== 'administrateur') {
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
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Utilisateurs</h3>
              <Users className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Administrateurs</h3>
              <Shield className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.administrateurs}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Enquêteurs</h3>
              <UserCheck className="text-orange-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.enqueteurs}</p>
          </div>
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
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom complet</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rôle</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date création</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {profiles.map((prof) => (
                      <tr key={prof.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{prof.full_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{prof.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            prof.role === 'administrateur'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {prof.role === 'administrateur' ? 'Administrateur' : 'Enquêteur'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(prof.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Informations Système</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Version de l&apos;application</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Base de données</span>
              <span className="font-medium">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Framework</span>
              <span className="font-medium">Next.js 13</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Statut système</span>
              <span className="font-medium text-green-600">Opérationnel</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Note importante</h3>
          <p className="text-blue-800 text-sm">
            Pour créer de nouveaux utilisateurs, utilisez l&apos;interface d&apos;administration Supabase.
            Les utilisateurs doivent avoir un profil créé dans la table &apos;profiles&apos; avec leur rôle assigné
            (administrateur ou enquêteur).
          </p>
        </div>
      </div>
    </div>
  );
}
