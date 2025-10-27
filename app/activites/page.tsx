'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activite, Ilot } from '@/lib/types';
import { Plus, Search, Download, Edit, Trash2, X, Upload, Users, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card'; // Import StatCard

export default function ActivitesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [filteredActivites, setFilteredActivites] = useState<Activite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingActivite, setEditingActivite] = useState<Activite | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadActivites();
    }
  }, [user]);

  useEffect(() => {
    const filtered = activites.filter(
      (act) =>
        act.type_activite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.objectif.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredActivites(filtered);
  }, [searchTerm, activites]);

  const loadActivites = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('activites')
      .select('*')
      .order('date', { ascending: false });

    if (data) {
      setActivites(data);
      setFilteredActivites(data);
    }
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return;

    const { error } = await supabase.from('activites').delete().eq('id', id);
    if (!error) {
      loadActivites();
    }
  };

  const exportToCSV = () => {
    const headers = ['Type', 'Date', 'Objectif', 'Public cible', 'Participants', 'Montant décaissé'];
    const rows = filteredActivites.map(a => [
      a.type_activite,
      a.date,
      a.objectif,
      a.public_cible || '',
      a.nombre_participants,
      a.montant_decaisse
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activites_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalActivites = activites.length;
  const totalParticipants = activites.reduce((sum, act) => sum + act.nombre_participants, 0);
  const totalMontantDecaisse = activites.reduce((sum, act) => sum + act.montant_decaisse, 0);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestion des Activités</h1>
            <p className="text-gray-600 mt-2 text-sm lg:text-base">Suivi des activités communautaires</p>
          </div>
          <button
            onClick={() => {
              setEditingActivite(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>Nouvelle Activité</span>
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
                title="Total Activités"
                value={totalActivites}
                icon={Calendar}
                bgColor="bg-blue-100"
                textColor="text-blue-800"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Total Participants"
                value={totalParticipants.toLocaleString()}
                icon={Users}
                bgColor="bg-green-100"
                textColor="text-green-800"
                iconColor="text-green-600"
              />
              <StatCard
                title="Budget Décaissé"
                value={`${totalMontantDecaisse.toLocaleString()} FCFA`}
                icon={DollarSign}
                bgColor="bg-purple-100"
                textColor="text-purple-800"
                iconColor="text-purple-600"
              />
            </div>

            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher une activité..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
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
                {filteredActivites.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucune activité trouvée</div>
                ) : (
                  <div className="grid gap-4">
                    {filteredActivites.map((activite) => (
                      <div key={activite.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{activite.type_activite}</h3>
                              <span className="text-sm text-gray-500">
                                {format(new Date(activite.date), 'dd/MM/yyyy')}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-3">{activite.objectif}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {activite.public_cible && (
                                <div>
                                  <span className="text-gray-600">Public:</span>
                                  <p className="font-medium">{activite.public_cible}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Participants:</span>
                                <p className="font-medium flex items-center space-x-1">
                                  <Users size={16} />
                                  <span>{activite.nombre_participants}</span>
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Montant:</span>
                                <p className="font-medium text-green-600">{activite.montant_decaisse.toLocaleString()} FCFA</p>
                              </div>
                            </div>

                            {activite.commentaires && (
                              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                                <span className="text-gray-600">Commentaires: </span>
                                <span className="text-gray-800">{activite.commentaires}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingActivite(activite);
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit size={20} />
                            </button>
                            {profile?.role === 'administrateur' && (
                              <button
                                onClick={() => handleDelete(activite.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <ActiviteForm
          activite={editingActivite}
          onClose={() => {
            setShowForm(false);
            setEditingActivite(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingActivite(null);
            loadActivites();
          }}
        />
      )}
    </div>
  );
}

function ActiviteForm({ activite, onClose, onSave }: { activite: Activite | null; onClose: () => void; onSave: () => void }) {
  const { user } = useAuth();
  const [ilots, setIlots] = useState<Array<{ id: string; nom: string }>>([]);
  const [selectedIlots, setSelectedIlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type_activite: activite?.type_activite || '',
    date: activite?.date || new Date().toISOString().split('T')[0],
    objectif: activite?.objectif || '',
    public_cible: activite?.public_cible || '',
    montant_decaisse: activite?.montant_decaisse || 0,
    nombre_participants: activite?.nombre_participants || 0,
    commentaires: activite?.commentaires || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIlots();
    if (activite) {
      loadSelectedIlots();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activite]);

  const loadIlots = async () => {
    const { data } = await supabase.from('ilots').select('id, nom').order('nom');
    if (data) {
      setIlots(data);
    }
  };

  const loadSelectedIlots = async () => {
    if (!activite) return;
    const { data } = await supabase
      .from('activites_ilots')
      .select('ilot_id')
      .eq('activite_id', activite.id);
    if (data) {
      setSelectedIlots(data.map(d => d.ilot_id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let activiteId = activite?.id;

      if (activite) {
        await supabase.from('activites').update(formData).eq('id', activite.id);
      } else {
        const { data } = await supabase
          .from('activites')
          .insert([{ ...formData, created_by: user?.id }])
          .select()
          .single();
        activiteId = data?.id;
      }

      if (activiteId) {
        await supabase.from('activites_ilots').delete().eq('activite_id', activiteId);

        if (selectedIlots.length > 0) {
          await supabase.from('activites_ilots').insert(
            selectedIlots.map(ilot_id => ({ activite_id: activiteId, ilot_id }))
          );
        }
      }

      onSave();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  const typeActivites = [
    'Set-Setal',
    'Conférence',
    'Sensibilisation',
    'Plantation',
    'Formation',
    'Suivi technique',
    'Autre'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{activite ? 'Modifier' : 'Nouvelle'} Activité</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d&apos;activité</label>
              <select
                required
                value={formData.type_activite}
                onChange={(e) => setFormData({ ...formData, type_activite: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {typeActivites.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objectif</label>
            <textarea
              required
              rows={3}
              value={formData.objectif}
              onChange={(e) => setFormData({ ...formData, objectif: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Public cible</label>
              <input
                type="text"
                value={formData.public_cible}
                onChange={(e) => setFormData({ ...formData, public_cible: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de participants</label>
              <input
                type="number"
                required
                value={formData.nombre_participants}
                onChange={(e) => setFormData({ ...formData, nombre_participants: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Montant décaissé (FCFA)</label>
            <input
              type="number"
              required
              value={formData.montant_decaisse}
              onChange={(e) => setFormData({ ...formData, montant_decaisse: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Îlots concernés</label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto">
              {ilots.map(ilot => (
                <label key={ilot.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIlots.includes(ilot.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIlots([...selectedIlots, ilot.id]);
                      } else {
                        setSelectedIlots(selectedIlots.filter(id => id !== ilot.id));
                      }
                    }}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm">{ilot.nom}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
            <textarea
              rows={3}
              value={formData.commentaires}
              onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
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