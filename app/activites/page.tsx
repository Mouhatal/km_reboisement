'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Activite } from '@/lib/types';
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  X,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { showSuccess, showError } from '@/lib/toast';

export default function ActivitesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [filteredActivites, setFilteredActivites] = useState<Activite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingActivite, setEditingActivite] = useState<Activite | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activiteToDelete, setActiviteToDelete] = useState<Activite | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const loadActivites = useCallback(async () => {
    setLoadingData(true);
    try {
      let query = supabase.from('activites').select('*').order('date', { ascending: false });
      if (profile?.role !== 'administrateur') query = query.eq('created_by', user?.id);
      const { data, error } = await query;
      if (error) throw error;
      setActivites(data || []);
      setFilteredActivites(data || []);
    } catch (err: any) {
      showError(err.message || 'Erreur lors du chargement des activités');
      setActivites([]);
      setFilteredActivites([]);
    } finally {
      setLoadingData(false);
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    if (user) loadActivites();
  }, [user, loadActivites]);

  useEffect(() => {
    let filtered = activites.filter(
      (act) =>
        (act.type_activite || 'Set-Setal').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.objectif || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.lieu || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (dateDebut) filtered = filtered.filter((act) => new Date(act.date) >= new Date(dateDebut));
    if (dateFin) filtered = filtered.filter((act) => new Date(act.date) <= new Date(dateFin));

    setFilteredActivites(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateDebut, dateFin, activites]);

  const handleDeleteClick = (activite: Activite) => {
    setActiviteToDelete(activite);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activiteToDelete) return;
    try {
      const { error } = await supabase.from('activites').delete().eq('id', activiteToDelete.id);
      if (error) throw error;
      showSuccess('Activité supprimée !');
      setConfirmOpen(false);
      setActiviteToDelete(null);
      await loadActivites();
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la suppression');
    }
  };

  const exportToCSV = () => {
    const headers = ['Type', 'Nom', 'Lieu', 'Date', 'Objectif', 'Public cible', 'Participants', 'Montant décaissé'];
    const rows = filteredActivites.map((a) => [
      a.type_activite || 'Set-Setal',
      a.nom || '',
      a.lieu || '',
      a.date,
      a.objectif || '',
      a.public_cible || '',
      String(a.nombre_participants ?? 0),
      String(a.montant_decaisse ?? 0),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activites_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalActivites = activites.length;
  const totalParticipants = activites.reduce((sum, act) => sum + (act.nombre_participants || 0), 0);
  const totalMontantDecaisse = activites.reduce((sum, act) => sum + (act.montant_decaisse || 0), 0);

  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const currentActivites = filteredActivites.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredActivites.length / itemsPerPage);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        {/* Header */}
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
          <div className="text-center py-12 text-gray-600">Chargement des données...</div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <StatCard title="Total Activités" value={totalActivites} icon={Calendar} bgColor="bg-blue-100" textColor="text-blue-800" iconColor="text-blue-600" />
              <StatCard title="Total Participants" value={totalParticipants.toLocaleString()} icon={Users} bgColor="bg-green-100" textColor="text-green-800" iconColor="text-green-600" />
              <StatCard title="Budget Décaissé" value={`${totalMontantDecaisse.toLocaleString()} FCFA`} icon={DollarSign} bgColor="bg-purple-100" textColor="text-purple-800" iconColor="text-purple-600" />
            </div>

            {/* Filtres + Export */}
            <div className="bg-white rounded-lg shadow mb-6 pb-6">
              <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="border px-2 py-1 rounded" />
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="border px-2 py-1 rounded" />
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Télécharger CSV"
                >
                  <Download size={20} />
                </button>
              </div>

              {/* Tableau */}
              <div className="p-4 overflow-x-auto">
                {currentActivites.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucune activité trouvée</div>
                ) : (
                  <table className="min-w-full table-fixed border border-gray-200 rounded-lg text-sm text-gray-800">
                    <thead className="bg-gray-50 font-semibold">
                      <tr>
                        <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TYPE</th>
                        <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NOM</th>
                        <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATE</th>
                        <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">OBJECTIF</th>
                        <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Public cible</th>
                        <th className="px-3 py-2 border-b text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Participants</th>
                        <th className="px-3 py-2 border-b text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                        <th className="px-3 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LIEU</th>
                        <th className="px-3 py-2 border-b text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentActivites.map((act) => (
                        <tr key={act.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border-b truncate font-medium">{act.type_activite || 'Set-Setal'}</td>
                          <td className="px-3 py-2 border-b truncate">{act.nom}</td>
                          <td className="px-3 py-2 border-b">{format(new Date(act.date), 'dd/MM/yyyy')}</td>
                          <td className="px-3 py-2 border-b truncate">{act.objectif}</td>
                          <td className="px-3 py-2 border-b">{act.public_cible}</td>
                          <td className="px-3 py-2 border-b text-center">{act.nombre_participants}</td>
                          <td className="px-3 py-2 border-b text-right">{(act.montant_decaisse || 0).toLocaleString()} FCFA</td>
                          <td className="px-3 py-2 border-b truncate">{act.lieu}</td>
                          <td className="px-3 py-2 border-b text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingActivite(act);
                                  setShowForm(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              {profile?.role === 'administrateur' && (
                                <button
                                  onClick={() => handleDeleteClick(act)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Supprimer"
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
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-end mt-4 space-x-2 p-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50">Précédent</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 border rounded-lg hover:bg-gray-100 ${currentPage === page ? 'bg-green-100 text-green-700' : ''}`}>{page}</button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50">Suivant</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Formulaire */}
        {showForm && (
          <ActiviteForm
            activite={editingActivite}
            onClose={() => { setShowForm(false); setEditingActivite(null); }}
            onSave={async () => { setShowForm(false); setEditingActivite(null); await loadActivites(); }}
          />
        )}

        {/* Modal suppression */}
        {confirmOpen && activiteToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4">Confirmer la suppression</h2>
              <p className="mb-6">
                Êtes-vous sûr de vouloir supprimer l&apos;activité &quot;{activiteToDelete.nom}&quot; ?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 border rounded">Annuler</button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- FORMULAIRE ACTIVITE ----------------

function ActiviteForm({ activite, onClose, onSave }: { activite: Activite | null; onClose: () => void; onSave: () => void; }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type_activite: activite?.type_activite || 'Set-Setal',
    nom: activite?.nom || '',
    lieu: activite?.lieu || '',
    date: activite?.date ? activite.date.split('T')[0] : new Date().toISOString().split('T')[0],
    objectif: activite?.objectif || '',
    public_cible: activite?.public_cible || '',
    montant_decaisse: activite?.montant_decaisse ?? 0,
    nombre_participants: activite?.nombre_participants ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const typeActivites = ['Set-Setal','Conférence','Sensibilisation','Plantation','Formation','Suivi technique','Autre'];

  useEffect(() => {
    setFormData({
      type_activite: activite?.type_activite || 'Set-Setal',
      nom: activite?.nom || '',
      lieu: activite?.lieu || '',
      date: activite?.date ? activite.date.split('T')[0] : new Date().toISOString().split('T')[0],
      objectif: activite?.objectif || '',
      public_cible: activite?.public_cible || '',
      montant_decaisse: activite?.montant_decaisse ?? 0,
      nombre_participants: activite?.nombre_participants ?? 0,
    });
  }, [activite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...formData, montant_decaisse: Number(formData.montant_decaisse) || 0, nombre_participants: Number(formData.nombre_participants) || 0 } as any;

      if (activite) {
        const { error } = await supabase.from('activites').update(dataToSave).eq('id', activite.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('activites').insert([{ ...dataToSave, created_by: user?.id }]);
        if (error) throw error;
      }

      showSuccess('Activité enregistrée !');
      onSave();
    } catch (err: any) {
      showError(err.message || "Erreur lors de l'enregistrement");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">{activite ? 'Modifier l&apos;activité' : 'Nouvelle activité'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Type d&apos;activité</label>
              <select
                value={formData.type_activite}
                onChange={(e) => setFormData({ ...formData, type_activite: e.target.value })}
                className="w-full border px-2 py-1 rounded"
              >
                {typeActivites.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Nom</label>
              <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full border px-2 py-1 rounded" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Lieu</label>
              <input type="text" value={formData.lieu} onChange={(e) => setFormData({ ...formData, lieu: e.target.value })} className="w-full border px-2 py-1 rounded" required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border px-2 py-1 rounded" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1 font-medium">Objectif</label>
              <textarea value={formData.objectif} onChange={(e) => setFormData({ ...formData, objectif: e.target.value })} className="w-full border px-2 py-1 rounded" rows={2} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Public cible</label>
              <input type="text" value={formData.public_cible} onChange={(e) => setFormData({ ...formData, public_cible: e.target.value })} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Nombre participants</label>
              <input type="number" value={formData.nombre_participants} onChange={(e) => setFormData({ ...formData, nombre_participants: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Montant décaissé (FCFA)</label>
              <input type="number" value={formData.montant_decaisse} onChange={(e) => setFormData({ ...formData, montant_decaisse: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
