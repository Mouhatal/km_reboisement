'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Materiel } from '@/lib/types';
import { Plus, Search, Download, Edit, Trash2, X, AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/lib/toast';

type EtatMateriel = 'disponible' | 'utilise' | 'en_panne' | 'remplace';

export default function LogistiquePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // ---------------- Hooks ----------------
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEtat, setFilterEtat] = useState<'all' | EtatMateriel>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showDeleteModal, setShowDeleteModal] = useState<{ visible: boolean; materielId?: string }>({ visible: false });

  // ---------------- Effets ----------------
  useEffect(() => { if (!loading && !user) router.push('/'); }, [user, loading, router]);
  useEffect(() => { if (user) loadMateriels(); }, [user]);
  useEffect(() => {
    let filtered = materiels.filter((m) =>
      m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.emplacement && m.emplacement.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filterEtat !== 'all') filtered = filtered.filter(m => m.etat === filterEtat);
    if (dateFilter) filtered = filtered.filter(m => format(new Date(m.date_acquisition), 'yyyy-MM-dd') === dateFilter);

    setFilteredMateriels(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterEtat, dateFilter, materiels]);

  // ---------------- Fonctions ----------------
  const loadMateriels = async () => {
    setLoadingData(true);
    const { data, error } = await supabase.from('materiel').select('*').order('created_at', { ascending: false });
    if (error) showError(`Erreur chargement: ${error.message}`);
    if (data) { setMateriels(data); setFilteredMateriels(data); }
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => {
    setShowDeleteModal({ visible: true, materielId: id });
  };

  const confirmDelete = async () => {
    if (!showDeleteModal.materielId) return;
    const { error } = await supabase.from('materiel').delete().eq('id', showDeleteModal.materielId);
    if (error) showError(`Erreur suppression: ${error.message}`);
    else { showSuccess('Matériel supprimé !'); loadMateriels(); }
    setShowDeleteModal({ visible: false });
  };

  const exportToCSV = () => {
    const headers = ['Type', 'Quantité', 'État', 'Emplacement', 'Date acquisition', 'Alerte'];
    const rows = filteredMateriels.map(m => [
      m.type, m.quantite, m.etat, m.emplacement || '', m.date_acquisition, m.alerte_maintenance ? 'Oui' : 'Non'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `materiel_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  // ---------------- Statistiques ----------------
  const stats = {
    total: materiels.length,
    disponible: materiels.filter(m => m.etat === 'disponible').length,
    utilise: materiels.filter(m => m.etat === 'utilise').length,
    en_panne: materiels.filter(m => m.etat === 'en_panne').length,
    remplace: materiels.filter(m => m.etat === 'remplace').length,
    alertes: materiels.filter(m => m.alerte_maintenance).length,
  };

  if (loading || !user) return null;

  const totalPages = Math.ceil(filteredMateriels.length / itemsPerPage);
  const paginatedMateriels = filteredMateriels.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestion Logistique</h1>
            <p className="text-gray-600 mt-2 text-sm lg:text-base">Suivi du matériel et équipements</p>
          </div>
          <button
            onClick={() => { setEditingMateriel(null); setShowForm(true); }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            <Plus size={20} /><span>Nouveau Matériel</span>
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 lg:mb-8">
          {[ 
            { title: 'Total', value: stats.total, color: 'blue', icon: Package },
            { title: 'Disponible', value: stats.disponible, color: 'green', icon: Package },
            { title: 'Utilisé', value: stats.utilise, color: 'purple', icon: Package },
            { title: 'En panne', value: stats.en_panne, color: 'red', icon: Package },
            { title: 'Alertes', value: stats.alertes, color: 'orange', icon: AlertTriangle },
          ].map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg p-4 flex items-center space-x-2 shadow">
              <stat.icon className={`text-${stat.color}-600`} />
              <div>
                <p className={`text-${stat.color}-800 font-semibold`}>{stat.title}</p>
                <p className="text-gray-700">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres et Tableau */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4 flex-1 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300" />
              </div>
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                     className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300" />
              <select value={filterEtat} onChange={e => setFilterEtat(e.target.value as 'all' | EtatMateriel)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300">
                <option value="all">Tous les états</option>
                <option value="disponible">Disponible</option>
                <option value="utilise">Utilisé</option>
                <option value="en_panne">En panne</option>
                <option value="remplace">Remplacé</option>
              </select>
            </div>
            <div>
              <button onClick={exportToCSV} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Download size={20} /></button>
            </div>
          </div>

          {/* Tableau */}
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full table-fixed border border-gray-200 rounded-lg text-sm text-gray-800">
              <thead className="bg-gray-50 font-semibold">
                <tr>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantité</th>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">État</th>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Emplacement</th>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Alerte</th>
                  <th className="px-4 py-2 border-b text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMateriels.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-gray-500">Aucun matériel trouvé</td></tr>
                ) : paginatedMateriels.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b font-medium">{m.type}</td>
                    <td className="px-4 py-2 border-b">{m.quantite}</td>
                    <td className="px-4 py-2 border-b">
                      <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full
                        ${m.etat === 'disponible' ? 'bg-green-100 text-green-800' : ''}
                        ${m.etat === 'utilise' ? 'bg-blue-100 text-blue-800' : ''}
                        ${m.etat === 'en_panne' ? 'bg-red-100 text-red-800' : ''}
                        ${m.etat === 'remplace' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {m.etat.charAt(0).toUpperCase() + m.etat.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b">{m.emplacement}</td>
                    <td className="px-4 py-2 border-b">{format(new Date(m.date_acquisition), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-2 border-b">{m.alerte_maintenance && <AlertTriangle className="inline-block text-orange-600" />}</td>
                    <td className="px-4 py-2 border-b text-center align-middle">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => { setEditingMateriel(m); setShowForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        {profile?.role === 'administrateur' &&
                          <button onClick={() => handleDelete(m.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 &&
            <div className="flex justify-end mt-4 space-x-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50">Précédent</button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded-lg hover:bg-gray-100 ${p === currentPage ? 'bg-green-200' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Suivant</button>
            </div>
          }
        </div>
      </div>

      {showForm && <MaterielForm materiel={editingMateriel} onClose={() => { setShowForm(false); setEditingMateriel(null); }} onSave={() => { setShowForm(false); setEditingMateriel(null); loadMateriels(); }} />}

      {/* Modal suppression */}
      {showDeleteModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer ce matériel ?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDeleteModal({ visible: false })} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Annuler</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Formulaire Materiel ----------------
function MaterielForm({ materiel, onClose, onSave }: { materiel: Materiel | null; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    type: materiel?.type || '',
    quantite: materiel?.quantite || 1,
    etat: materiel?.etat || 'disponible' as EtatMateriel,
    emplacement: materiel?.emplacement || '',
    date_acquisition: materiel?.date_acquisition || new Date().toISOString().split('T')[0],
    alerte_maintenance: materiel?.alerte_maintenance || false,
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...formData, ...(materiel ? {} : { created_by: user?.id }) };
      let error = null;
      if (materiel?.id) {
        const { error: updateError } = await supabase.from('materiel').update(dataToSave).eq('id', materiel.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('materiel').insert([dataToSave]);
        error = insertError;
      }
      if (error) showError(`Erreur: ${error.message}`);
      else { showSuccess('Matériel enregistré !'); onSave(); }
    } catch (err: any) { showError(`Erreur inattendue: ${err.message}`); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{materiel ? 'Modifier' : 'Nouveau'} Matériel</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Type</label>
              <input type="text" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} 
                     className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-300 focus:border-gray-300" />
            </div>
            <div>
              <label>Quantité</label>
              <input type="number" required min={1} value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: parseInt(e.target.value) })} 
                     className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-300 focus:border-gray-300" />
            </div>
            <div>
              <label>État</label>
              <select value={formData.etat} onChange={e => setFormData({ ...formData, etat: e.target.value as EtatMateriel })}
                      className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-300 focus:border-gray-300">
                <option value="disponible">Disponible</option>
                <option value="utilise">Utilisé</option>
                <option value="en_panne">En panne</option>
                <option value="remplace">Remplacé</option>
              </select>
            </div>
            <div>
              <label>Emplacement</label>
              <input type="text" value={formData.emplacement} onChange={e => setFormData({ ...formData, emplacement: e.target.value })} 
                     className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-300 focus:border-gray-300" />
            </div>
            <div>
              <label>Date acquisition</label>
              <input type="date" value={formData.date_acquisition} onChange={e => setFormData({ ...formData, date_acquisition: e.target.value })} 
                     className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-300 focus:border-gray-300" />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" checked={formData.alerte_maintenance} onChange={e => setFormData({ ...formData, alerte_maintenance: e.target.checked })} className="w-4 h-4 accent-green-500" />
              <span>Alerte maintenance</span>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
