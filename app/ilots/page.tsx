'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { supabase } from '@/lib/supabase';
import { Ilot } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Plus, Search, Download, Eye, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MapComponent = dynamic(() => import('@/components/map-component').then(mod => ({ default: mod.MapComponent })), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
});

export default function IlotsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
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
    const filtered = ilots.filter(
      (ilot) =>
        ilot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ilot.type_de_sol.toLowerCase().includes(searchTerm.toLowerCase())
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
    const headers = ['Nom', 'Superficie (ha)', 'Type de sol', 'Nombre de plants', 'Taux de survie (%)', 'Date de suivi'];
    const rows = filteredIlots.map(i => [
      i.nom,
      i.superficie_ha,
      i.type_de_sol,
      i.nombre_de_plants,
      i.taux_de_survie,
      i.date_de_suivi
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilots_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Îlots</h1>
            <p className="text-gray-600 mt-2">Suivi des zones de reboisement</p>
          </div>
          <button
            onClick={() => {
              setEditingIlot(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nouvel Îlot</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
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

            <div className="flex items-center space-x-2">
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
            {loadingData ? (
              <div className="text-center py-12">Chargement...</div>
            ) : viewMode === 'map' ? (
              <MapComponent
                markers={filteredIlots.map(i => ({
                  id: i.id,
                  nom: i.nom,
                  latitude: i.latitude,
                  longitude: i.longitude,
                  nombre_de_plants: i.nombre_de_plants,
                  taux_de_survie: i.taux_de_survie,
                }))}
                onMarkerClick={(id) => {
                  const ilot = ilots.find(i => i.id === id);
                  if (ilot) {
                    setEditingIlot(ilot);
                    setShowForm(true);
                  }
                }}
              />
            ) : filteredIlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucun îlot trouvé</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Superficie</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type de Sol</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plants</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Taux Survie</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Suivi</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredIlots.map((ilot) => (
                      <tr key={ilot.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{ilot.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ilot.superficie_ha} ha</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ilot.type_de_sol}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{ilot.nombre_de_plants.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            ilot.taux_de_survie >= 70 ? 'bg-green-100 text-green-800' :
                            ilot.taux_de_survie >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ilot.taux_de_survie}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(ilot.date_de_suivi), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingIlot(ilot);
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit size={16} />
                            </button>
                            {profile?.role === 'administrateur' && (
                              <button
                                onClick={() => handleDelete(ilot.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
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

      {showForm && (
        <IlotForm
          ilot={editingIlot}
          onClose={() => {
            setShowForm(false);
            setEditingIlot(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingIlot(null);
            loadIlots();
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
    taux_de_survie: ilot?.taux_de_survie || 0,
    date_de_suivi: ilot?.date_de_suivi || new Date().toISOString().split('T')[0],
    observations: ilot?.observations || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (ilot) {
        await supabase.from('ilots').update(formData).eq('id', ilot.id);
      } else {
        await supabase.from('ilots').insert([{ ...formData, created_by: user?.id }]);
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
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de plants</label>
              <input
                type="number"
                required
                value={formData.nombre_de_plants}
                onChange={(e) => setFormData({ ...formData, nombre_de_plants: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Taux de survie (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={formData.taux_de_survie}
                onChange={(e) => setFormData({ ...formData, taux_de_survie: parseFloat(e.target.value) })}
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
