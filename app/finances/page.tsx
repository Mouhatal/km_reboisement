'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Decaissement, Depense, Activite } from '@/lib/types';
import { Plus, Search, Download, Edit, Trash2, X, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card'; // Import StatCard

export default function FinancesPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'decaissements' | 'depenses'>('decaissements');
  const [decaissements, setDecaissements] = useState<Decaissement[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (!loading && profile?.role !== 'administrateur') {
      router.push('/ilots');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user) {
      loadFinances();
    }
  }, [user]);

  useEffect(() => {
    const formParam = searchParams.get('form');
    const tabParam = searchParams.get('tab');
    if (formParam === 'true') {
      if (tabParam === 'decaissements' || tabParam === 'depenses') {
        setActiveTab(tabParam);
      }
      setShowForm(true);
    }
  }, [searchParams]);

  const loadFinances = async () => {
    setLoadingData(true);
    const [decaissementsRes, depensesRes] = await Promise.all([
      supabase.from('decaissements').select('*').order('date', { ascending: false }),
      supabase.from('depenses').select('*').order('date', { ascending: false }),
    ]);

    if (decaissementsRes.data) setDecaissements(decaissementsRes.data);
    if (depensesRes.data) setDepenses(depensesRes.data);
    setLoadingData(false);
  };

  const handleDelete = async (id: string, type: 'decaissement' | 'depense') => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce ${type} ?`)) return;

    const table = type === 'decaissement' ? 'decaissements' : 'depenses';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      loadFinances();
    }
  };

  const getTotalDecaissements = () => {
    return decaissements.reduce((sum, d) => sum + d.montant, 0);
  };

  const getTotalDepenses = () => {
    return depenses.reduce((sum, d) => sum + d.montant, 0);
  };

  const getSolde = () => {
    return getTotalDecaissements() - getTotalDepenses();
  };

  if (loading || !user) {
    return null;
  }

  const totalDecaissements = getTotalDecaissements();
  const totalDepenses = getTotalDepenses();
  const solde = getSolde();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion Financière</h1>
            <p className="text-gray-600 mt-2">Suivi des décaissements et dépenses</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nouvelle Entrée</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Décaissements"
            value={`${totalDecaissements.toLocaleString()} FCFA`}
            icon={TrendingDown}
            bgColor="bg-blue-100"
            textColor="text-blue-800"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Total Dépenses"
            value={`${totalDepenses.toLocaleString()} FCFA`}
            icon={TrendingUp}
            bgColor="bg-red-100"
            textColor="text-red-800"
            iconColor="text-red-600"
          />
          <StatCard
            title="Solde Restant"
            value={`${solde.toLocaleString()} FCFA`}
            icon={DollarSign}
            bgColor={solde >= 0 ? 'bg-green-100' : 'bg-red-100'}
            textColor={solde >= 0 ? 'text-green-800' : 'text-red-800'}
            iconColor={solde >= 0 ? 'text-green-600' : 'text-red-600'}
            description={solde < 0 ? 'Budget dépassé' : undefined}
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('decaissements')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'decaissements'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Décaissements ({decaissements.length})
              </button>
              <button
                onClick={() => setActiveTab('depenses')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'depenses'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dépenses ({depenses.length})
              </button>
            </div>
          </div>

          <div className="p-4">
            {loadingData ? (
              <div className="text-center py-12">Chargement...</div>
            ) : activeTab === 'decaissements' ? (
              <DecaissementsTable
                decaissements={decaissements}
                onEdit={(item: Decaissement) => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                onDelete={(id: string) => handleDelete(id, 'decaissement')}
                canDelete={profile?.role === 'administrateur'}
              />
            ) : (
              <DepensesTable
                depenses={depenses}
                onEdit={(item: Depense) => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                onDelete={(id: string) => handleDelete(id, 'depense')}
                canDelete={profile?.role === 'administrateur'}
              />
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <FinanceForm
          type={activeTab}
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
            router.replace('/finances', undefined); // Clear URL params
          }}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            loadFinances();
            router.replace('/finances', undefined); // Clear URL params
          }}
        />
      )}
    </div>
  );
}

function DecaissementsTable({ decaissements, onEdit, onDelete, canDelete }: any) {
  if (decaissements.length === 0) {
    return <div className="text-center py-12 text-gray-500">Aucun décaissement enregistré</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Référence</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {decaissements.map((item: Decaissement) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(item.date), 'dd/MM/yyyy')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.reference_bancaire}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                {item.montant.toLocaleString()} FCFA
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
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
    </div>
  );
}

function DepensesTable({ depenses, onEdit, onDelete, canDelete }: any) {
  if (depenses.length === 0) {
    return <div className="text-center py-12 text-gray-500">Aucune dépense enregistrée</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remarque</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {depenses.map((item: Depense) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(item.date), 'dd/MM/yyyy')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.type_depense}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{item.remarque || '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                {item.montant.toLocaleString()} FCFA
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
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
    </div>
  );
}

function FinanceForm({ type, item, onClose, onSave }: any) {
  const { user } = useAuth();
  const [activites, setActivites] = useState<Array<{ id: string; type_activite: string; date: string }>>([]);
  const [formType, setFormType] = useState<'decaissement' | 'depense'>(
    item ? (item.reference_bancaire ? 'decaissement' : 'depense') : type === 'decaissements' ? 'decaissement' : 'depense'
  );
  const [formData, setFormData] = useState({
    date: item?.date || new Date().toISOString().split('T')[0],
    montant: item?.montant || 0,
    reference_bancaire: item?.reference_bancaire || '',
    description: item?.description || '',
    activite_id: item?.activite_id || '',
    type_depense: item?.type_depense || '',
    remarque: item?.remarque || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formType === 'depense') {
      loadActivites();
    }
  }, [formType]);

  const loadActivites = async () => {
    const { data } = await supabase
      .from('activites')
      .select('id, type_activite, date')
      .order('date', { ascending: false });
    if (data) setActivites(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (formType === 'decaissement') {
        const decaissementData = {
          date: formData.date,
          montant: formData.montant,
          reference_bancaire: formData.reference_bancaire,
          description: formData.description,
          created_by: user?.id,
        };

        if (item && item.reference_bancaire) {
          await supabase.from('decaissements').update(decaissementData).eq('id', item.id);
        } else {
          await supabase.from('decaissements').insert([decaissementData]);
        }
      } else {
        const depenseData = {
          date: formData.date,
          montant: formData.montant,
          activite_id: formData.activite_id || null,
          type_depense: formData.type_depense,
          remarque: formData.remarque,
          created_by: user?.id,
        };

        if (item && item.type_depense) {
          await supabase.from('depenses').update(depenseData).eq('id', item.id);
        } else {
          await supabase.from('depenses').insert([depenseData]);
        }
      }

      onSave();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  const typesDepense = [
    'Matériel',
    'Transport',
    'Personnel',
    'Formation',
    'Communication',
    'Autre'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {item ? 'Modifier' : 'Nouvelle'} {formType === 'decaissement' ? 'Décaissement' : 'Dépense'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!item && (
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setFormType('decaissement')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  formType === 'decaissement'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Décaissement
              </button>
              <button
                type="button"
                onClick={() => setFormType('depense')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  formType === 'depense'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dépense
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {formType === 'decaissement' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Référence bancaire</label>
                <input
                  type="text"
                  required
                  value={formData.reference_bancaire}
                  onChange={(e) => setFormData({ ...formData, reference_bancaire: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de dépense</label>
                <select
                  required
                  value={formData.type_depense}
                  onChange={(e) => setFormData({ ...formData, type_depense: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  {typesDepense.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activité associée</label>
                <select
                  value={formData.activite_id}
                  onChange={(e) => setFormData({ ...formData, activite_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Aucune</option>
                  {activites.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.type_activite} - {format(new Date(act.date), 'dd/MM/yyyy')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarque</label>
                <textarea
                  rows={3}
                  value={formData.remarque}
                  onChange={(e) => setFormData({ ...formData, remarque: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </>
          )}

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