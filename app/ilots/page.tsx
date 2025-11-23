'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Ilot } from '@/lib/types';
import { Plus, Search, Download, X, Leaf, AreaChart, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { IlotsTable } from '@/components/ilots-table';
import { showSuccess, showError } from '@/lib/toast';
import dynamic from 'next/dynamic';

// ⚡ Import dynamique correct pour MapComponent (exportation nommée)
const MapComponent = dynamic(() => import('@/components/map-component').then(mod => mod.MapComponent), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
});

// Page principale
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
  const [showDeleteDialog, setShowDeleteDialog] = useState<{show: boolean, id?: string}>({show:false});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentIlots = filteredIlots.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredIlots.length / itemsPerPage);
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => { if (!loading && !user) router.push('/'); }, [user, loading, router]);
  useEffect(() => { if (user) loadIlots(); }, [user]);
  useEffect(() => { if (searchParams.get('form') === 'true') setShowForm(true); }, [searchParams]);

  useEffect(() => {
    const filtered = ilots.filter(
      (ilot) =>
        ilot.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ilot.type_de_sol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ilot.observations?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIlots(filtered);
    setCurrentPage(1); // Reset pagination on new search
  }, [searchTerm, ilots]);

  const loadIlots = async () => {
    setLoadingData(true);
    const { data, error } = await supabase.from('ilots').select('*').order('created_at', { ascending: false });
    if (data) { setIlots(data); setFilteredIlots(data); }
    setLoadingData(false);
  };

  const handleDelete = async (id: string) => setShowDeleteDialog({ show: true, id });
  const confirmDelete = async (id: string) => {
    const { error } = await supabase.from('ilots').delete().eq('id', id);
    if (error) showError(`Erreur: ${error.message}`); 
    else { showSuccess('Îlot supprimé !'); loadIlots(); }
    setShowDeleteDialog({ show: false });
  };

  const exportToCSV = () => {
    if (typeof window === 'undefined') return; // ⚡ protection côté serveur

    const headers = ['Nom','Superficie (ha)','Type de sol','Nombre de plants','Plants survivants','Taux de survie (%)','Date de suivi','Observations'];
    const rows = filteredIlots.map(i => [i.nom,i.superficie_ha,i.type_de_sol,i.nombre_de_plants,i.nombre_de_plants_survivants,i.taux_de_survie,i.date_de_suivi,i.observations||'']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
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

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestion des Îlots</h1>
            <p className="text-gray-600 mt-2 text-sm lg:text-base">Suivi des zones de reboisement</p>
          </div>
          <button onClick={() => { setEditingIlot(null); setShowForm(true); }} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto">
            <Plus size={20} /><span>Nouvel Îlot</span>
          </button>
        </div>

        {loadingData ? (
          <div className="text-center py-12 text-gray-600">Chargement des données...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <StatCard title="Superficie Totale" value={`${totalSuperficie.toFixed(2)} ha`} icon={AreaChart} bgColor="bg-blue-100" textColor="text-blue-800" iconColor="text-blue-600" />
              <StatCard title="Plants Totaux" value={totalPlants.toLocaleString()} icon={Leaf} bgColor="bg-green-100" textColor="text-green-800" iconColor="text-green-600" />
              <StatCard title="Taux de Survie Moyen" value={`${tauxSurvieMoyen.toFixed(1)}%`} icon={BarChart3} bgColor="bg-purple-100" textColor="text-purple-800" iconColor="text-purple-600" />
            </div>

            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="Rechercher un îlot..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg ${viewMode==='list'?'bg-green-100 text-green-700':'text-gray-600 hover:bg-gray-100'}`}>Liste</button>
                  <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-lg ${viewMode==='map'?'bg-green-100 text-green-700':'text-gray-600 hover:bg-gray-100'}`}>Carte</button>
                  <button onClick={exportToCSV} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Download size={20} /></button>
                </div>
              </div>

              <div className="p-4">
                {viewMode === 'map' ? (
                  <MapComponent markers={filteredIlots.map(i => ({ id: i.id, nom: i.nom, latitude: i.latitude, longitude: i.longitude, nombre_de_plants: i.nombre_de_plants, taux_de_survie: i.taux_de_survie }))} />
                ) : (
                  <>
                    <IlotsTable ilots={currentIlots} onEdit={(ilot) => { setEditingIlot(ilot); setShowForm(true); }} onDelete={handleDelete} canDelete={profile?.role==='administrateur'} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50">Précédent</button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button key={i} onClick={() => goToPage(i + 1)} className={`px-3 py-1 border rounded-lg hover:bg-gray-100 ${currentPage === i + 1 ? 'bg-green-100 text-green-700' : ''}`}>{i + 1}</button>
                        ))}
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50">Suivant</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && <IlotForm ilot={editingIlot} onClose={() => { setShowForm(false); setEditingIlot(null); router.replace('/ilots', undefined); }} onSave={() => { setShowForm(false); setEditingIlot(null); loadIlots(); router.replace('/ilots', undefined); }} />}

      {/* Boîte de dialogue suppression custom */}
      {showDeleteDialog.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="mb-6">Voulez-vous vraiment supprimer cet îlot ?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteDialog({show:false})} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={() => confirmDelete(showDeleteDialog.id!)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Formulaire Îlot
function IlotForm({ ilot, onClose, onSave }: { ilot: Ilot | null; onClose: () => void; onSave: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nom: ilot?.nom || '',
    superficie_ha: ilot?.superficie_ha || 0,
    type_de_sol: ilot?.type_de_sol || '',
    latitude: ilot?.latitude || 0,
    longitude: ilot?.longitude || 0,
    nombre_de_plants: ilot?.nombre_de_plants || 0,
    nombre_de_plants_survivants: ilot?.nombre_de_plants_survivants || 0,
    taux_de_survie: ilot?.taux_de_survie || 0,
    date_de_suivi: ilot?.date_de_suivi || new Date().toISOString().split('T')[0],
    observations: ilot?.observations || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { nombre_de_plants, nombre_de_plants_survivants } = formData;
    let calculatedTaux = 0;
    if (nombre_de_plants > 0) calculatedTaux = (nombre_de_plants_survivants / nombre_de_plants) * 100;
    setFormData(prev => ({ ...prev, taux_de_survie: parseFloat(calculatedTaux.toFixed(1)) }));
  }, [formData.nombre_de_plants, formData.nombre_de_plants_survivants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const dataToSave = { ...formData, ...(ilot ? {} : { created_by: user?.id }) };
      let error = null;
      if (ilot?.id) { const { error: updateError } = await supabase.from('ilots').update(dataToSave).eq('id', ilot.id); error = updateError; } 
      else { const { error: insertError } = await supabase.from('ilots').insert([dataToSave]); error = insertError; }
      if (error) showError(`Erreur: ${error.message}`); else { showSuccess('Îlot enregistré !'); onSave(); }
    } catch (err: any) { showError(`Erreur inattendue: ${err.message}`); console.error(err); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{ilot ? 'Modifier' : 'Nouvel'} Îlot</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Nom</label>
              <input type="text" value={formData.nom} onChange={(e)=>setFormData({...formData,nom:e.target.value})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Superficie (ha)</label>
              <input type="number" value={formData.superficie_ha} onChange={(e)=>setFormData({...formData,superficie_ha:parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Type de sol</label>
              <input type="text" value={formData.type_de_sol} onChange={(e)=>setFormData({...formData,type_de_sol:e.target.value})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Nombre de plants</label>
              <input type="number" value={formData.nombre_de_plants} onChange={(e)=>setFormData({...formData,nombre_de_plants:parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Plants survivants</label>
              <input type="number" value={formData.nombre_de_plants_survivants} onChange={(e)=>setFormData({...formData,nombre_de_plants_survivants:parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Taux de survie (%)</label>
              <input type="text" readOnly value={formData.taux_de_survie.toFixed(1)} className="w-full px-4 py-2 border bg-gray-50 text-gray-600"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Latitude</label>
              <input type="number" step="0.000001" value={formData.latitude} onChange={(e)=>setFormData({...formData,latitude:parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div>
              <label className="block font-semibold mb-1">Longitude</label>
              <input type="number" step="0.000001" value={formData.longitude} onChange={(e)=>setFormData({...formData,longitude:parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Observations</label>
              <textarea value={formData.observations} onChange={(e)=>setFormData({...formData,observations:e.target.value})} className="w-full px-4 py-2 border rounded-lg"/>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{saving?'Enregistrement...':'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}