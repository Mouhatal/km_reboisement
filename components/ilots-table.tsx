'use client';

import React, { useState } from 'react';
import { Ilot } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface IlotsTableProps {
  ilots: Ilot[];
  onEdit: (ilot: Ilot) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const ITEMS_PER_PAGE = 10; // Définir le nombre d'éléments par page

export function IlotsTable({ ilots, onEdit, onDelete, canDelete }: IlotsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(ilots.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentIlots = ilots.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSurvivalRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800';
    if (rate >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (ilots.length === 0) {
    return <div className="text-center py-12 text-gray-500">Aucun îlot trouvé</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Superficie (ha)</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type de sol</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Plants plantés</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Plants survivants</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Taux de survie (%)</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dernier suivi</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentIlots.map((ilot) => (
            <tr key={ilot.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{ilot.nom}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{ilot.superficie_ha.toFixed(2)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{ilot.type_de_sol}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">{(ilot.nombre_de_plants || 0).toLocaleString()}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">{(ilot.nombre_de_plants_survivants || 0).toLocaleString()}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getSurvivalRateColor(ilot.taux_de_survie || 0)}`}>
                  {(ilot.taux_de_survie || 0).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {format(new Date(ilot.date_de_suivi), 'dd/MM/yyyy')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(ilot)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => onDelete(ilot.id)}
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}