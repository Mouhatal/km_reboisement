'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Ilot } from '@/lib/types';

interface IlotFormProps {
  ilot?: Ilot | null;
  onClose: () => void;
  onSaved: (ilot: Ilot) => void;
}

export default function IlotForm({ ilot, onClose, onSaved }: IlotFormProps) {
  const [formData, setFormData] = useState<Partial<Ilot>>({
    nom: '',
    superficie_ha: 0,
    type_de_sol: '',
    nombre_de_plants: 0,
    nombre_de_plants_survivants: 0,
    taux_de_survie: 0,
    latitude: 0,
    longitude: 0,
    date_de_suivi: '',
    observations: '',
  });

  const [saving, setSaving] = useState(false);

  // Charger les données si on édite un ilot
  useEffect(() => {
    if (ilot) setFormData(ilot);
  }, [ilot]);

  // Calcul automatique du taux de survie
  useEffect(() => {
    if (
      formData.nombre_de_plants &&
      formData.nombre_de_plants_survivants !== undefined
    ) {
      const taux =
        (formData.nombre_de_plants_survivants / formData.nombre_de_plants) * 100;
      setFormData((prev) => ({ ...prev, taux_de_survie: taux }));
    }
  }, [formData.nombre_de_plants, formData.nombre_de_plants_survivants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      taux_de_survie: formData.taux_de_survie || 0,
    };

    let data: Ilot | null = null;
    let error = null;

    if (ilot) {
      const res = await supabase
        .from('ilots')
        .update(payload)
        .eq('id', ilot.id)
        .select()
        .single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase.from('ilots').insert(payload).select().single();
      data = res.data;
      error = res.error;
    }

    if (!error && data) {
      onSaved(data);
      onClose();
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-green-700 mb-4">
          {ilot ? 'Modifier un Îlot' : 'Ajouter un Nouvel Îlot'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="font-medium">
              Nom
              <input
                type="text"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </label>

            <label className="font-medium">
              Superficie (ha)
              <input
                type="number"
                value={formData.superficie_ha}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    superficie_ha: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>

            <label className="font-medium">
              Type de sol
              <input
                type="text"
                value={formData.type_de_sol}
                onChange={(e) =>
                  setFormData({ ...formData, type_de_sol: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>

            <label className="font-medium">
              Nombre de plants
              <input
                type="number"
                value={formData.nombre_de_plants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nombre_de_plants: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>

            <label className="font-medium">
              Plants survivants
              <input
                type="number"
                value={formData.nombre_de_plants_survivants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nombre_de_plants_survivants: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>

            <label className="font-medium">
              Taux de survie (%)
              <input
                type="text"
                readOnly
                value={formData.taux_de_survie?.toFixed(1) || 0}
                className="w-full px-3 py-2 border bg-gray-100 text-gray-600 rounded-lg"
              />
            </label>

            <label className="font-medium">
              Latitude
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    latitude: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>

            <label className="font-medium">
              Longitude
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    longitude: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>

            <label className="font-medium col-span-2">
              Date de suivi
              <input
                type="date"
                value={formData.date_de_suivi}
                onChange={(e) =>
                  setFormData({ ...formData, date_de_suivi: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </label>
          </div>

          <label className="font-medium block">
            Observations
            <textarea
              rows={4}
              value={formData.observations || ''}
              onChange={(e) =>
                setFormData({ ...formData, observations: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </label>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
