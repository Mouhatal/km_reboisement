'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Ilot } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Plus, Search, Download, Edit, Trash2, X, Leaf, AreaChart, BarChart3, MapPin } from 'lucide-react';
import { format } = from 'date-fns';
import { StatCard } from '@/components/ui/stat-card'; // Import StatCard
import { IlotsTable } from '@/components/ilots-table'; // Import the new IlotsTable component

const MapComponent = dynamic(() => import('@/components/map-component').then(mod => ({ default: mod.MapComponent })), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
});

export default function IlotsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ilots, setIlots] = useState<Ilot[]>([]);
  const [filteredIlots, setFilteredIlots] = useState<Ilot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIlot, setEditingIlot] = useState<Ilot | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadIlots();
    }
  }, [user]);

  useEffect(() => {
    const formParam = searchParams.get('form');
    if (formParam === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const filtered = ilots.filter(
      (ilot) =>
        ilot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ilot.type_de_sol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ilot.observations?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIlots(filtered);
  }, [searchTerm, ilots]);

  const loadIlots = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('ilots')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setIlots(data);
      setFilteredIlots(data);
    }
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet îlot ?')) return;

    const { error } = await supabase.from('ilots').delete().eq('id', id);
    if (!error) {
      loadIlots();
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Superficie (ha)', 'Type de sol', 'Nombre de plants', 'Plants survivants', 'Taux de survie (%)', 'Date de suivi', 'Observations'];
    const rows = filteredIlots.map(i => [
      i.nom,
      i.superficie_ha,
      i.type_de_sol,
      i.nombre_de_plants,
      i.nombre_de_plants_survivants,
      i.taux_de_survie,
      i.date_de_suivi,
      i.observations || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilots_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalSuperficie = ilots.reduce((sum, ilot) => sum + ilot.superficie_ha, 0);
  const totalPlants = ilots.reduce((sum, ilot) => sum + (ilot.nombre_de_plants || 0), 0);
  const tauxSurvieMoyen = ilots.length > 0 ? ilots.reduce((sum, ilot) => sum + (ilot.taux_de_survie || 0), 0) / ilots.length : 0;

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestion des Îlots</h1>
            <p className="text-gray-600 mt-2 text-sm lg:text-base">Suivi des zones de reboisement</p>
          </div>
          <button
            onClick={() => {
              setEditingIlot(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nouvel Îlot</span>
          </button>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Chargement des données...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <StatCard
                title="Superficie Totale"
                value={`${totalSuperficie.toFixed(2)} ha`}
                icon={AreaChart}
                bgColor="bg-blue-100"
                textColor="text-blue-800"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Plants Totaux"
                value={totalPlants.toLocaleString()}
                icon={Leaf}
                bgColor="bg-green-100"
                textColor="text-green-800"
                iconColor="text-green-600"
              />
              <StatCard
                title="Taux de Survie Moyen"
                value={`${tauxSurvieMoyen.toFixed(1)}%`}
                icon={BarChart3}
                bgColor="bg-purple-100"
                textColor="text-purple-800"
                iconColor="text-purple-600"
              />
            </div>

            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4 flex-1 w-full">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher un îlot..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Liste
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 rounded-lg ${viewMode === 'map' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Carte
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Download size={20} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4">
                {viewMode === 'map' ? (
                  <MapComponent
                    markers={filteredIlots.map(i => ({
                      id: i.id,
                      nom: i.nom,
                      latitude: i.latitude,
                      longitude: i.longitude,
                      nombre_de_plants: i.nombre_de_plants,
                      taux_de_survie: i.taux_de_survie,
                    }))}
                    // onMarkerClick a été retiré
                  />
                ) : (
                  <IlotsTable
                    ilots={filteredIlots}
                    onEdit={(ilot) => {
                      setEditingIlot(ilot);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                    canDelete={profile?.role === 'administrateur'}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <IlotForm
          ilot={editingIlot}
          onClose={() => {
            setShowForm(false);
            setEditingIlot(null);
            router.replace('/ilots', undefined); // Remove form=true from URL
          }}
          onSave={() => {
            setShowForm(false);
            setEditingIlot(null);
            loadIlots();
            router.replace('/ilots', undefined); // Remove form=true from URL
          }}
        />
      )}
    </div>
  );
}

function IlotForm({ ilot, onClose, onSave }: { ilot: Ilot | null; onClose: () => void; onSave: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nom: ilot?.nom || '',
    superficie_ha: ilot?.superficie_ha || 0,
    type_de_sol: ilot?.type_de_sol || '',
    latitude: ilot?.latitude || 0,
    longitude: ilot?.longitude || 0,
    nombre_de_plants: ilot?.nombre_de_plants || 0,
    nombre_de_plants_survivants: ilot?.nombre_de_plants_survivants || 0, // Nouveau champ
    taux_de_survie: ilot?.taux_de_survie || 0, // Sera calculé
    date_de_suivi: ilot?.date_de_suivi || new Date().toISOString().split('T')[0],
    observations: ilot?.observations || '',
  });
  const [saving, setSaving] = useState(false);

  // Effect to calculate taux_de_survie whenever relevant fields change
  useEffect(() => {
    const { nombre_de_plants, nombre_de_plants_survivants } = formData;
    let calculatedTaux = 0;
    if (nombre_de_plants > 0) {
      calculatedTaux = (nombre_de_plants_survivants / nombre_de_plants) * 100;
    }
    setFormData(prev => ({ ...prev, taux_de_survie: parseFloat(calculatedTaux.toFixed(1)) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.nombre_de_plants, formData.nombre_de_plants_survivants]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        // taux_de_survie est déjà mis à jour par l'effet, donc on peut l'envoyer directement
      };

      if (ilot) {
        await supabase.from('ilots').update(dataToSave).eq('id', ilot.id);
      } else {
        await supabase.from('ilots').insert([{ ...dataToSave, created_by: user?.id }]);
      }
      onSave();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{ilot ? 'Modifier' : 'Nouvel'} Îlot</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l&apos;îlot</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Superficie (ha)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.superficie_ha}
                onChange={(e) => setFormData({ ...formData, superficie_ha: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de sol</label>
              <input
                type="text"
                required
                value={formData.type_de_sol}
                onChange={(e) => setFormData({ ...formData, type_de_sol: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de plants plantés</label>
              <input
                type="number"
                required
                min="0"
                value={formData.nombre_de_plants}
                onChange={(e) => setFormData({ ...formData, nombre_de_plants: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de plants survivants</label>
              <input
                type="number"
                required
                min="0"
                value={formData.nombre_de_plants_survivants}
                onChange={(e) => setFormData({ ...formData, nombre_de_plants_survivants: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taux de survie (%)</label>
              <input
                type="text" // Changed to text as it's read-only
                readOnly
                value={formData.taux_de_survie.toFixed(1)} // Display calculated value
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de suivi</label>
              <input
                type="date"
                required
                value={formData.date_de_suivi}
                onChange={(e) => setFormData({ ...formData, date_de_suivi: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
            <textarea
              rows={4}
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}