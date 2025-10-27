'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardStats } from '@/lib/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Calendar, DollarSign, TrendingUp, Package, AlertCircle, Leaf, Activity, Plus, Wallet, TrendingDown, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { QuickActionButton } from '@/components/ui/quick-action-button';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [ilotsByType, setIlotsByType] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    // Admin check is now handled by the navigation component, but keeping it here for direct access protection
    if (!loading && user && profile?.role !== 'administrateur') {
      router.push('/ilots');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user && profile?.role === 'administrateur') {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [ilotsRes, activitesRes, decaissementsRes, depensesRes] = await Promise.all([
        supabase.from('ilots').select('*'),
        supabase.from('activites').select('*').order('date', { ascending: false }).limit(5),
        supabase.from('decaissements').select('montant'),
        supabase.from('depenses').select('montant'),
      ]);

      const ilots = ilotsRes.data || [];
      const activites = activitesRes.data || [];
      const decaissements = decaissementsRes.data || [];
      const depenses = depensesRes.data || [];

      const totalPlants = ilots.reduce((sum, i) => sum + (i.nombre_de_plants || 0), 0);
      const avgSurvival = ilots.length > 0
        ? ilots.reduce((sum, i) => sum + (i.taux_de_survie || 0), 0) / ilots.length
        : 0;

      const totalDecaissements = decaissements.reduce((sum, d) => sum + (d.montant || 0), 0);
      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
      const soldeRestant = totalDecaissements - totalDepenses;
      const tauxUtilisation = totalDecaissements > 0 ? (totalDepenses / totalDecaissements) * 100 : 0;


      setStats({
        total_ilots: ilots.length,
        total_plants: totalPlants,
        taux_survie_moyen: avgSurvival,
        total_activites: activites.length,
        total_decaissements: totalDecaissements,
        total_depenses: totalDepenses,
        solde_restant: soldeRestant,
        taux_utilisation_budgetaire: tauxUtilisation, // Add this to DashboardStats type
      });

      setRecentActivities(activites);

      const typeCounts = ilots.reduce((acc: any, ilot: any) => {
        const type = ilot.type_de_sol || 'Non spécifié';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      setIlotsByType(
        Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
      );
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || !user || profile?.role !== 'administrateur') {
    return null; // Render nothing or a loading spinner while redirecting or unauthorized
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="bg-green-600 text-white p-6 rounded-lg shadow-md mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold">Tableau de Bord</h1>
          <p className="text-green-100 mt-2 text-sm lg:text-base">Suivi du projet de reboisement communautaire.</p>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Chargement des données...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <StatCard
                title="Îlots totaux"
                value={stats?.total_ilots || 0}
                icon={Leaf}
                bgColor="bg-green-100"
                textColor="text-green-800"
                iconColor="text-green-600"
              />
              <StatCard
                title="Taux de survie moyen"
                value={`${(stats?.taux_survie_moyen || 0).toFixed(1)}%`}
                icon={BarChart3}
                bgColor="bg-blue-100"
                textColor="text-blue-800"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Activités"
                value={stats?.total_activites || 0}
                icon={Activity}
                bgColor="bg-purple-100"
                textColor="text-purple-800"
                iconColor="text-purple-600"
              />
              <StatCard
                title="Solde"
                value={`${(stats?.solde_restant || 0).toLocaleString()} FCFA`}
                icon={DollarSign}
                bgColor="bg-yellow-100"
                textColor="text-yellow-800"
                iconColor="text-yellow-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Résumé Financier</h2>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Encaissements totaux</span>
                    <span className="font-medium text-green-600">
                      +{(stats?.total_decaissements || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Dépenses totales</span>
                    <span className="font-medium text-red-600">
                      -{(stats?.total_depenses || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold">Solde disponible</span>
                    <span className={`font-bold ${stats && stats.solde_restant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stats?.solde_restant || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Taux d&apos;utilisation budgétaire</span>
                    <span className="font-medium">
                      {(stats?.taux_utilisation_budgetaire || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Actions Rapides</h2>
                <div className="grid grid-cols-2 gap-4">
                  <QuickActionButton
                    label="Nouvel Îlot"
                    icon={Plus}
                    onClick={() => router.push('/ilots?form=true')} // Will handle opening form in ilots page
                    bgColor="bg-green-50"
                    textColor="text-green-700"
                  />
                  <QuickActionButton
                    label="Nouvelle activité"
                    icon={Activity}
                    onClick={() => router.push('/activites?form=true')} // Will handle opening form in activites page
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                  />
                  <QuickActionButton
                    label="Encaissement"
                    icon={Wallet}
                    onClick={() => router.push('/finances?tab=decaissements&form=true')} // Will handle opening form in finances page
                    bgColor="bg-purple-50"
                    textColor="text-purple-700"
                  />
                  <QuickActionButton
                    label="Dépense"
                    icon={TrendingDown}
                    onClick={() => router.push('/finances?tab=depenses&form=true')} // Will handle opening form in finances page
                    bgColor="bg-red-50"
                    textColor="text-red-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Répartition des Îlots par Type de Sol</h2>
                {ilotsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ilotsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ilotsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-12">Aucune donnée disponible</div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Activités Récentes</h2>
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="border-l-4 border-green-500 pl-4 py-2">
                        <div className="font-medium text-gray-900">{activity.type_activite}</div>
                        <div className="text-sm text-gray-600">{activity.objectif}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">Aucune activité récente</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}