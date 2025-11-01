export type UserRole = 'administrateur' | 'enqueteur';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Ilot {
  id: string;
  nom: string;
  superficie_ha: number;
  type_de_sol: string;
  latitude: number;
  longitude: number;
  nombre_de_plants: number;
  nombre_de_plants_survivants: number; // Nouveau champ
  taux_de_survie: number; // Sera calculé
  photos: string[];
  date_de_suivi: string;
  observations: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IlotHistorique {
  id: string;
  ilot_id: string;
  taux_de_survie: number;
  nombre_de_plants: number;
  nombre_de_plants_survivants: number; // Nouveau champ
  observations: string | null;
  photos: string[];
  date_de_suivi: string;
  created_by: string;
  created_at: string;
}

export interface Activite {
  id: string;
  type_activite: string;
  date: string;
  objectif: string;
  public_cible: string | null;
  montant_decaisse: number;
  photos: string[];
  factures: string[];
  liste_presence: string[];
  nombre_participants: number;
  commentaires: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Materiel {
  id: string;
  type: string;
  quantite: number;
  etat: 'disponible' | 'utilise' | 'en_panne' | 'remplace';
  emplacement: string | null;
  date_acquisition: string;
  ilot_affecte_id: string | null;
  activite_affectee_id: string | null;
  alerte_maintenance: boolean;
  notes: string | null;
  created_by: string; // Ajouté pour correspondre au schéma de la DB
  created_at: string;
  updated_at: string;
}

export interface Decaissement {
  id: string;
  date: string;
  montant: number;
  reference_bancaire: string;
  description: string | null;
  recus: string[]; // Added for receipts/invoices
  created_by: string;
  created_at: string;
}

export interface Depense {
  id: string;
  activite_id: string;
  montant: number;
  type_depense: string;
  justificatif: string | null; // This field already exists, but we'll use 'recus' for consistency
  remarque: string | null;
  date: string;
  recus: string[]; // Added for receipts/invoices
  created_by: string;
  created_at: string;
}

export interface DashboardStats {
  total_ilots: number;
  total_plants: number;
  taux_survie_moyen: number;
  total_activites: number;
  total_decaissements: number;
  total_depenses: number;
  solde_restant: number;
  taux_utilisation_budgetaire: number; // Added this field
}