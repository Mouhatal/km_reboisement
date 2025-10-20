'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardStats } from '@/lib/types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, Calendar, DollarSign, TrendingUp, Package, AlertCircle } from 'lucide-react';

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
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

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

      setStats({
        total_ilots: ilots.length,
        total_plants: totalPlants,
        taux_survie_moyen: avgSurvival,
        total_activites: activites.length,
        total_decaissements: totalDecaissements,
        total_depenses: totalDepenses,
        solde_restant: totalDecaissements - totalDepenses,
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

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-2">Vue d&apos;ensemble du projet de reboisement</p>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Chargement des données...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={MapPin}
                title="Total Îlots"
                value={stats?.total_ilots || 0}
                color="green"
              />
              <StatCard
                icon={TrendingUp}
                title="Plants Total"
                value={(stats?.total_plants || 0).toLocaleString()}
                color="blue"
              />
              <StatCard
                icon={TrendingUp}
                title="Taux de Survie Moyen"
                value={`${(stats?.taux_survie_moyen || 0).toFixed(1)}%`}
                color="green"
              />
              <StatCard
                icon={Calendar}
                title="Activités"
                value={stats?.total_activites || 0}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <FinanceCard
                title="Décaissements"
                amount={stats?.total_decaissements || 0}
                color="blue"
              />
              <FinanceCard
                title="Dépenses"
                amount={stats?.total_depenses || 0}
                color="red"
              />
              <FinanceCard
                title="Solde Restant"
                amount={stats?.solde_restant || 0}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Répartition des Îlots par Type de Sol</h2>
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
                <h2 className="text-xl font-semibold mb-4">Activités Récentes</h2>
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

function StatCard({ icon: Icon, title, value, color }: any) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color as keyof typeof colors]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ title, amount, color }: any) {
  const colors = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center space-x-3 mb-2">
        <DollarSign size={20} className={colors[color as keyof typeof colors]} />
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </div>
      <p className={`text-2xl font-bold ${colors[color as keyof typeof colors]}`}>
        {amount.toLocaleString()} FCFA
      </p>
    </div>
  );
}
