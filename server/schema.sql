CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  sexe TEXT,
  nationalite TEXT,
  type_identite TEXT,
  numero_identite TEXT,
  prenom TEXT,
  prenom_ar TEXT,
  nom TEXT,
  nom_ar TEXT,
  nom_complet TEXT,
  date_naissance DATE,
  lieu_naissance TEXT,
  lieu_naissance_ar TEXT,
  adresse TEXT,
  adresse_ar TEXT,
  ville TEXT,
  email TEXT,
  telephone TEXT,
  langue TEXT,
  categorie TEXT,
  centre_immatriculateur TEXT,
  num_dossier TEXT,
  date_inscription DATE,
  date_contrat DATE,
  formule TEXT,
  montant_total NUMERIC DEFAULT 0,
  montant_paye NUMERIC DEFAULT 0,
  heures_effectuees INT DEFAULT 0,
  heures_prevues INT DEFAULT 20,
  statut TEXT DEFAULT 'actif',
  remarques TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom TEXT,
  role TEXT DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  type TEXT DEFAULT 'réservation',
  client_id INT REFERENCES clients(id) ON DELETE CASCADE,
  client_nom TEXT,
  clients_data TEXT,
  date DATE,
  heure TEXT,
  statut TEXT DEFAULT 'confirmé'
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id) ON DELETE CASCADE,
  client_nom TEXT,
  montant NUMERIC,
  mode TEXT,
  note TEXT,
  date DATE,
  statut TEXT DEFAULT 'payé'
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id) ON DELETE CASCADE,
  client_nom TEXT,
  date DATE,
  heure TEXT,
  statut TEXT DEFAULT 'présent',
  notes TEXT
);
