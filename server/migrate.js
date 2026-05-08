import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { pool } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function load(file) {
  const p = join(__dirname, file)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null
}

async function migrate() {
  const clientsDB = load('clients.json')
  const resDB = load('reservations.json')
  const payDB = load('payments.json')
  const attDB = load('attendance.json')

  if (clientsDB?.clients?.length) {
    console.log(`Migrating ${clientsDB.clients.length} clients...`)
    for (const c of clientsDB.clients) {
      await pool.query(
        `INSERT INTO clients
          (id, sexe, nationalite, type_identite, numero_identite,
           prenom, prenom_ar, nom, nom_ar, nom_complet,
           date_naissance, lieu_naissance, lieu_naissance_ar,
           adresse, adresse_ar, ville, email, telephone,
           langue, categorie, centre_immatriculateur,
           date_inscription, formule, montant_total, montant_paye,
           heures_effectuees, heures_prevues, statut, remarques)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id, c.sexe, c.nationalite, c.typeIdentite, c.numeroIdentite,
          c.prenom, c.prenomAr, c.nom, c.nomAr, c.nomComplet,
          c.dateNaissance || null, c.lieuNaissance, c.lieuNaissanceAr,
          c.adresse, c.adresseAr, c.ville, c.email, c.telephone,
          c.langue, c.categorie, c.centreImmatriculateur,
          c.dateInscription || null, c.formule,
          c.montantTotal || 0, c.montantPaye || 0,
          c.heuresEffectuees || 0, c.heuresPrevues || 20,
          c.statut || 'actif', c.remarques || '',
        ]
      )
    }
    await pool.query(`SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients))`)
    console.log('✓ Clients migrated')
  }

  if (resDB?.reservations?.length) {
    console.log(`Migrating ${resDB.reservations.length} reservations...`)
    for (const r of resDB.reservations) {
      await pool.query(
        `INSERT INTO reservations (id, client_id, client_nom, date, heure, statut)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.clientId, r.clientNom, r.date, r.heure, r.statut || 'confirmé']
      )
    }
    await pool.query(`SELECT setval('reservations_id_seq', (SELECT MAX(id) FROM reservations))`)
    console.log('✓ Reservations migrated')
  }

  if (payDB?.payments?.length) {
    console.log(`Migrating ${payDB.payments.length} payments...`)
    for (const p of payDB.payments) {
      await pool.query(
        `INSERT INTO payments (id, client_id, client_nom, montant, mode, note, date, statut)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.clientId, p.clientNom, p.montant || 0, p.mode, p.note || '', p.date, p.statut || 'payé']
      )
    }
    await pool.query(`SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments))`)
    console.log('✓ Payments migrated')
  }

  if (attDB?.attendance?.length) {
    console.log(`Migrating ${attDB.attendance.length} attendance records...`)
    for (const a of attDB.attendance) {
      await pool.query(
        `INSERT INTO attendance (id, client_id, client_nom, date, heure, statut, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [a.id, a.clientId, a.clientNom, a.date, a.heure || '', a.statut || 'présent', a.notes || '']
      )
    }
    await pool.query(`SELECT setval('attendance_id_seq', (SELECT MAX(id) FROM attendance))`)
    console.log('✓ Attendance migrated')
  }

  console.log('\nMigration complete!')
  await pool.end()
}

migrate().catch(e => { console.error(e); process.exit(1) })
