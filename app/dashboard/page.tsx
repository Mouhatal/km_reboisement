'use client';

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardStats } from "@/lib/types";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend,
  LineChart, Line
} from "recharts";
import { Leaf, BarChart3, Activity, DollarSign, Package } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

// Couleurs
const PIE_COLORS_ILOTS = ['#26474E', '#F27438', '#31572C', '#4BC0C0', '#9966FF', '#969587', '#C8574D', '#FAD7C4', '#FCB5AA', '#8C9C7C', '#435B7B', '#5D726F', '#464155', '#B67332','#4A919E'];
const PIE_COLORS_DEPENSES = ['#BB2D0C', '#8C9C7C', '#B8CBD0', '#4BC0C0', '#9966FF','#969587', '#C8574D', '#FAD7C4', '#FCB5AA', '#8C9C7C','#435B7B', '#5D726F', '#464155', '#B67332','#4A919E'];
const BAR_COLORS_ACTIVITY = ['#26474E', '#F27438', '#007198', '#31572C', '#4BC0C0', '#9E9F8D', '#C8574D', '#FAD7C4', '#FCB5AA', '#8C9C7C','#435B7B', '#5D726F', '#464155', '#B67332','#4A919E'];
const LINE_COLOR_DEPENSES = '#1B9476';
const LINE_COLOR_BUDGET = '#EA925E';

// Format nombres
function formatNumber(val: number) {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K';
  return val.toString();
}

// Raccourcir labels pour éviter dépassement
function shortLabel(label: string, max = 8) {
  if (label.length <= max) return label;
  return label.substring(0, max) + "…";
}

// Abréviation intelligent des activités
function shortActivityType(label: string) {
  const map: Record<string, string> = {
    "formation": "Forma",
    "sensibilisation": "Sensib",
    "set-setal": "SetS",
    "conference": "Conf",
    "plantation": "Plant",
    "suivi technique": "Suiv.T",
    "autre": "Autre",
  };
  const key = label.trim().toLowerCase();
  return map[key] || shortLabel(label, 6);
}

export default function DashboardClient() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [ilotsByType, setIlotsByType] = useState<any[]>([]);
  const [activityByType, setActivityByType] = useState<any[]>([]);
  const [depensesByType, setDepensesByType] = useState<any[]>([]);
  const [depensesMensuelles, setDepensesMensuelles] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filtres de dates
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");

  // Redirection selon rôle
  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && profile?.role !== 'administrateur') router.push('/ilots');
  }, [user, profile, loading, router]);

  // Fonction chargement des données memoïsée pour éviter boucle infinie
  const loadDashboardData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ilotsRes, activitesRes, decaissementsRes, depensesRes] = await Promise.all([
        supabase.from('ilots').select('*'),
        supabase.from('activites').select('*').order('date', { ascending: false }),
        supabase.from('decaissements').select('montant'),
        supabase.from('depenses').select('*'),
      ]);

      const ilots = ilotsRes.data || [];
      const activites = activitesRes.data || [];
      const decaissements = decaissementsRes.data || [];
      const depenses = depensesRes.data || [];

      // Stats principales
      const totalPlants = ilots.reduce((sum, i) => sum + (i.nombre_de_plants || 0), 0);
      const avgSurvival = ilots.length > 0 ? ilots.reduce((sum, i) => sum + (i.taux_de_survie || 0), 0) / ilots.length : 0;
      const totalDecaissements = decaissements.reduce((sum, d) => sum + Number(d.montant || 0), 0);
      const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant || 0), 0);
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
        taux_utilisation_budgetaire: tauxUtilisation,
      });

      setRecentActivities(activites.slice(0, 2));

      // Répartition îlots
      const typeCounts = ilots.reduce((acc: any, ilot: any) => {
        const type = ilot.type_de_sol || 'Non spécifié';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      setIlotsByType(Object.entries(typeCounts).map(([name, value]) => ({ name: shortLabel(name), value })));

      // Répartition activités
      const activityCounts = activites.reduce((acc: any, act: any) => {
        const type = act.type_activite || 'autre';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      setActivityByType(
        Object.entries(activityCounts).map(([name, value]) => ({
          name,
          short: shortActivityType(name),
          value
        }))
      );

      // Dépenses par type
      const depensesTypeCounts = depenses.reduce((acc: any, d: any) => {
        const type = d.type_depense || 'Autre';
        acc[type] = (acc[type] || 0) + Number(d.montant || 0);
        return acc;
      }, {});
      setDepensesByType(
        Object.entries(depensesTypeCounts).map(([name, value]) => ({
          name: shortLabel(name),
          value
        }))
      );

      // Évolution des dépenses
      let filtered = depenses;
      if (dateDebut) filtered = filtered.filter(d => d.date >= dateDebut);
      if (dateFin) filtered = filtered.filter(d => d.date <= dateFin);

      const depensesParJour = filtered
        .map(dep => ({
          date: dep.date,
          depenses: Number(dep.montant || 0),
          budget: totalDecaissements / 12,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setDepensesMensuelles(depensesParJour);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoadingData(false);
    }
  }, [dateDebut, dateFin]);

  // Charger les données au chargement et si l'utilisateur est admin
  useEffect(() => {
    if (user && profile?.role === 'administrateur') loadDashboardData();
  }, [user, profile, loadDashboardData]);

  // Recharger les dépenses lorsqu’on change les dates
  useEffect(() => {
    if (user) loadDashboardData();
  }, [dateDebut, dateFin, user, loadDashboardData]);

  if (loading || !user || loadingData || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Chargement du tableau de bord...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">

        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-lg shadow-md mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold">Tableau de Bord</h1>
          <p className="text-green-100 mt-2 text-sm lg:text-base">Suivi du projet de reboisement communautaire.</p>
        </div>

        {/* StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard title="Îlots totaux" value={stats.total_ilots} icon={Leaf} bgColor="bg-slate-100" textColor="text-green-800" iconColor="text-green-600" />
          <StatCard title="Total plants" value={stats.total_plants} icon={Activity} bgColor="bg-slate-100" textColor="text-green-800" iconColor="text-green-600" />
          <StatCard title="Taux de survie (%)" value={parseFloat(stats.taux_survie_moyen.toFixed(1))} icon={BarChart3} bgColor="bg-slate-100" textColor="text-green-800" iconColor="text-green-600" />
          <StatCard title="Solde restant (FCFA)" value={stats.solde_restant} icon={DollarSign} bgColor="bg-slate-100" textColor="text-green-800" iconColor="text-green-600" />
          <StatCard title="Taux d’utilisation (%)" value={parseFloat(stats.taux_utilisation_budgetaire.toFixed(1))} icon={Package} bgColor="bg-slate-100" textColor="text-green-800" iconColor="text-green-600" />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          
          {/* Répartition ilots */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Répartition des Îlots par Type de Sol</h2>
            {ilotsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={ilotsByType} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`} 
                    outerRadius={80} 
                    dataKey="value"
                  >
                    {ilotsByType.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS_ILOTS[index % PIE_COLORS_ILOTS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value:number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center text-gray-500 py-12">Aucune donnée disponible</div>}
          </div>

          {/* Répartition activités */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Répartition des Activités par Type</h2>
            {activityByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityByType}>
                  <XAxis dataKey="short" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(value:number) => value.toLocaleString()}
                    labelFormatter={(short) => {
                      const item = activityByType.find((x) => x.short === short);
                      return item ? item.name : short;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value">
                    {activityByType.map((entry, index) => (
                      <Cell key={index} fill={BAR_COLORS_ACTIVITY[index % BAR_COLORS_ACTIVITY.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="text-center text-gray-500 py-12">Aucune donnée disponible</div>}
          </div>
        </div>

        {/* Dépenses par type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Dépenses par Type</h2>
            {depensesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={depensesByType} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    label={({ name, percent }) => `${name} (${(percent*100).toFixed(2)}%)`} 
                    outerRadius={100} 
                    dataKey="value"
                  >
                    {depensesByType.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS_DEPENSES[index % PIE_COLORS_DEPENSES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value:number) => value.toLocaleString() + ' FCFA'} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center text-gray-500 py-12">Aucune donnée disponible</div>}
          </div>

          {/* Budget vs Dépenses */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Budget vs Dépenses vs Restant</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{ name: 'Budget', decaissements: stats.total_decaissements, depenses: stats.total_depenses, restant: stats.solde_restant }]} >
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip formatter={(value:number) => value.toLocaleString() + ' FCFA'} />
                <Legend />
                <Bar dataKey="decaissements" name="Budget alloué" fill="#26474E" />
                <Bar dataKey="depenses" name="Dépenses effectuées" fill="#8C9C7C" />
                <Bar dataKey="restant" name="Restant" fill="#F27438" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution des dépenses avec Filtres */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Évolution des Dépenses</h2>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Date début</label>
                <input 
                  type="date"
                  className="border p-2 rounded"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Date fin</label>
                <input 
                  type="date"
                  className="border p-2 rounded"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={depensesMensuelles} margin={{ top:10, right:30, left:0, bottom:10 }}>
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip formatter={(value:number) => value.toLocaleString() + ' FCFA'} />
              <Legend />
              <Line type="monotone" dataKey="depenses" stroke={LINE_COLOR_DEPENSES} strokeWidth={3} name="Dépenses" dot={{ r:4 }} />
              <Line type="monotone" dataKey="budget" stroke={LINE_COLOR_BUDGET} strokeWidth={3} name="Budget" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activités récentes */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Activités Récentes</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="font-medium text-gray-900">{activity.type_activite}</div>
                  <div className="text-sm text-gray-600">{activity.objectif}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(activity.date).toLocaleDateString('fr-FR')}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-center text-gray-500 py-12">Aucune activité récente</div>}
        </div>

      </div>
    </div>
  );
}
