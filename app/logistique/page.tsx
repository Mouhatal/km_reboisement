'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Materiel, Ilot, Activite } from '@/lib/types';
import { Plus, Search, Download, Edit, Trash2, X, AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function LogistiquePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtat, setFilterEtat] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadMateriels();
    }
  }, [user]);

  useEffect(() => {
    let filtered = materiels.filter(
      (mat) =>
        mat.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mat.emplacement && mat.emplacement.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterEtat !== 'all') {
      filtered = filtered.filter(mat => mat.etat === filterEtat);
    }

    setFilteredMateriels(filtered);
  }, [searchTerm, filterEtat, materiels]);

  const loadMateriels = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('materiel')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setMateriels(data);
      setFilteredMateriels(data);
    }
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) return;

    const { error } = await supabase.from('materiel').delete().eq('id', id);
    if (!error) {
      loadMateriels();
    }
  };

  const exportToCSV = () => {
    const headers = ['Type', 'Quantité', 'État', 'Emplacement', 'Date acquisition', 'Alerte maintenance'];
    const rows = filteredMateriels.map(m => [
      m.type,
      m.quantite,
      m.etat,
      m.emplacement || '',
      m.date_acquisition,
      m.alerte_maintenance ? 'Oui' : 'Non'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `materiel_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatsByEtat = () => {
    return {
      disponible: materiels.filter(m => m.etat === 'disponible').length,
      utilise: materiels.filter(m => m.etat === 'utilise').length,
      en_panne: materiels.filter(m => m.etat === 'en_panne').length,
      remplace: materiels.filter(m => m.etat === 'remplace').length,
      alertes: materiels.filter(m => m.alerte_maintenance).length,
    };
  };

  if (loading || !user) {
    return null;
  }

  const stats = getStatsByEtat();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion Logistique</h1>
            <p className="text-gray-600 mt-2">Suivi du matériel et équipements</p>
          </div>
          <button
            onClick={() => {
              setEditingMateriel(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nouveau Matériel</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Disponible" value={stats.disponible} color="green" />
          <StatCard label="Utilisé" value={stats.utilise} color="blue" />
          <StatCard label="En panne" value={stats.en_panne} color="red" />
          <StatCard label="Remplacé" value={stats.remplace} color="gray" />
          <StatCard label="Alertes" value={stats.alertes} color="orange" icon={AlertTriangle} />
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher du matériel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterEtat}
                onChange={(e) => setFilterEtat(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tous les états</option>
                <option value="disponible">Disponible</option>
                <option value="utilise">Utilisé</option>
                <option value="en_panne">En panne</option>
                <option value="remplace">Remplacé</option>
              </select>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="p-4">
            {loadingData ? (
              <div className="text-center py-12">Chargement...</div>
            ) : filteredMateriels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Aucun matériel trouvé</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantité</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">État</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Emplacement</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date acquisition</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Alertes</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMateriels.map((materiel) => (
                      <tr key={materiel.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{materiel.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{materiel.quantite}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getEtatColor(materiel.etat)}`}>
                            {getEtatLabel(materiel.etat)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{materiel.emplacement || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(materiel.date_acquisition), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {materiel.alerte_maintenance && (
                            <AlertTriangle size={20} className="text-orange-500 inline" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingMateriel(materiel);
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit size={16} />
                            </button>
                            {profile?.role === 'administrateur' && (
                              <button
                                onClick={() => handleDelete(materiel.id)}
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
        <MaterielForm
          materiel={editingMateriel}
          onClose={() => {
            setShowForm(false);
            setEditingMateriel(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingMateriel(null);
            loadMateriels();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: any) {
  const colors: any = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
}

function getEtatColor(etat: string) {
  switch (etat) {
    case 'disponible': return 'bg-green-100 text-green-800';
    case 'utilise': return 'bg-blue-100 text-blue-800';
    case 'en_panne': return 'bg-red-100 text-red-800';
    case 'remplace': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getEtatLabel(etat: string) {
  switch (etat) {
    case 'disponible': return 'Disponible';
    case 'utilise': return 'Utilisé';
    case 'en_panne': return 'En panne';
    case 'remplace': return 'Remplacé';
    default: return etat;
  }
}

function MaterielForm({ materiel, onClose, onSave }: { materiel: Materiel | null; onClose: () => void; onSave: () => void }) {
  const [ilots, setIlots] = useState<Array<{ id: string; nom: string }>>([]);
  const [activites, setActivites] = useState<Array<{ id: string; type_activite: string; date: string }>>([]);
  const [formData, setFormData] = useState({
    type: materiel?.type || '',
    quantite: materiel?.quantite || 1,
    etat: materiel?.etat || 'disponible',
    emplacement: materiel?.emplacement || '',
    date_acquisition: materiel?.date_acquisition || new Date().toISOString().split('T')[0],
    ilot_affecte_id: materiel?.ilot_affecte_id || null,
    activite_affectee_id: materiel?.activite_affectee_id || null,
    alerte_maintenance: materiel?.alerte_maintenance || false,
    notes: materiel?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIlotsAndActivites();
  }, []);

  const loadIlotsAndActivites = async () => {
    const [ilotsRes, activitesRes] = await Promise.all([
      supabase.from('ilots').select('id, nom').order('nom'),
      supabase.from('activites').select('id, type_activite, date').order('date', { ascending: false })
    ]);

    if (ilotsRes.data) setIlots(ilotsRes.data);
    if (activitesRes.data) setActivites(activitesRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        ilot_affecte_id: formData.ilot_affecte_id || null,
        activite_affectee_id: formData.activite_affectee_id || null,
      };

      if (materiel) {
        await supabase.from('materiel').update(dataToSave).eq('id', materiel.id);
      } else {
        await supabase.from('materiel').insert([dataToSave]);
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
          <h2 className="text-2xl font-bold">{materiel ? 'Modifier' : 'Nouveau'} Matériel</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de matériel</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
              <select
                required
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="disponible">Disponible</option>
                <option value="utilise">Utilisé</option>
                <option value="en_panne">En panne</option>
                <option value="remplace">Remplacé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date d&apos;acquisition</label>
              <input
                type="date"
                required
                value={formData.date_acquisition}
                onChange={(e) => setFormData({ ...formData, date_acquisition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emplacement</label>
              <input
                type="text"
                value={formData.emplacement}
                onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Îlot affecté</label>
              <select
                value={formData.ilot_affecte_id || ''}
                onChange={(e) => setFormData({ ...formData, ilot_affecte_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Aucun</option>
                {ilots.map(ilot => (
                  <option key={ilot.id} value={ilot.id}>{ilot.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activité affectée</label>
              <select
                value={formData.activite_affectee_id || ''}
                onChange={(e) => setFormData({ ...formData, activite_affectee_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Aucune</option>
                {activites.map(activite => (
                  <option key={activite.id} value={activite.id}>
                    {activite.type_activite} - {format(new Date(activite.date), 'dd/MM/yyyy')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alerte_maintenance}
                  onChange={(e) => setFormData({ ...formData, alerte_maintenance: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Alerte maintenance</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
