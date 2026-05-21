import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { pool } from './db.js'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

pool.query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_contrat DATE DEFAULT NULL").catch(() => {})
pool.query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL").catch(() => {})
pool.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'réservation'").catch(() => {})
pool.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS clients_data TEXT").catch(() => {})

async function initDB() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  await pool.query(schema)
  const { rows } = await pool.query('SELECT COUNT(*) FROM users')
  if (parseInt(rows[0].count) === 0) {
    const hash = await bcrypt.hash('admin123', 10)
    await pool.query(
      "INSERT INTO users (username, password_hash, nom, role) VALUES ('admin', $1, 'Administrateur', 'admin')",
      [hash]
    )
    console.log('Admin par défaut créé : admin / admin123')
  }
}
initDB().catch(e => console.error('DB init error:', e))

const PYTHON_URL = process.env.PYTHON_API_URL
  ? `https://${process.env.PYTHON_API_URL}`
  : 'http://localhost:8000'

app.use('/api/documents', createProxyMiddleware({
  target: PYTHON_URL,
  pathRewrite: { '^/api': '' },
  changeOrigin: true,
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayMorocco() {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' })
}

function deriveHeuresPrevues(formule = '') {
  const match = formule.match(/(\d+)h/i)
  return match ? parseInt(match[1]) : 20
}

function toClient(r) {
  return {
    id: r.id,
    sexe: r.sexe,
    nationalite: r.nationalite,
    typeIdentite: r.type_identite,
    numeroIdentite: r.numero_identite,
    prenom: r.prenom,
    prenomAr: r.prenom_ar,
    nom: r.nom,
    nomAr: r.nom_ar,
    nomComplet: r.nom_complet,
    dateNaissance: r.date_naissance ? r.date_naissance : '',
    lieuNaissance: r.lieu_naissance,
    lieuNaissanceAr: r.lieu_naissance_ar,
    adresse: r.adresse,
    adresseAr: r.adresse_ar,
    ville: r.ville,
    email: r.email,
    telephone: r.telephone,
    langue: r.langue,
    categorie: r.categorie,
    centreImmatriculateur: r.centre_immatriculateur,
    dateInscription: r.date_inscription ? r.date_inscription : '',
    formule: r.formule,
    montantTotal: parseFloat(r.montant_total) || 0,
    montantPaye: parseFloat(r.montant_paye) || 0,
    heuresEffectuees: r.heures_effectuees || 0,
    heuresPrevues: r.heures_prevues || 20,
    statut: r.statut,
    remarques: r.remarques,
    numDossier: r.num_dossier || '',
    dateContrat: r.date_contrat ? r.date_contrat : '',
  }
}

function toReservation(r) {
  return {
    id: r.id,
    type: r.type || 'réservation',
    clientId: r.client_id,
    clientNom: r.client_nom || '',
    clientsData: r.clients_data ? JSON.parse(r.clients_data) : [],
    date: r.date ? r.date : '',
    heure: r.heure || '',
    statut: r.statut || 'confirmé',
  }
}

function toPayment(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    clientNom: r.client_nom,
    montant: parseFloat(r.montant) || 0,
    mode: r.mode,
    note: r.note,
    date: r.date ? r.date : '',
    statut: r.statut,
  }
}

function toAttendance(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    clientNom: r.client_nom,
    date: r.date ? r.date : '',
    heure: r.heure,
    statut: r.statut,
    notes: r.notes,
  }
}

// ─── Clients ──────────────────────────────────────────────────────────────────

app.get('/api/clients', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients WHERE deleted_at IS NULL ORDER BY id DESC')
  res.json(rows.map(toClient))
})

app.get('/api/clients/deleted', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
  res.json(rows.map(toClient))
})

app.get('/api/clients/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable' })
  res.json(toClient(rows[0]))
})

app.post('/api/clients', async (req, res) => {
  const d = req.body
  const nomComplet = `${d.prenom || ''} ${d.nom || ''}`.trim()
  const heuresPrevues = deriveHeuresPrevues(d.formule)
  const today = todayMorocco()
  const { rows } = await pool.query(
    `INSERT INTO clients
      (sexe, nationalite, type_identite, numero_identite,
       prenom, prenom_ar, nom, nom_ar, nom_complet,
       date_naissance, lieu_naissance, lieu_naissance_ar,
       adresse, adresse_ar, ville, email, telephone,
       langue, categorie, centre_immatriculateur,
       date_inscription, formule, montant_total, montant_paye,
       heures_effectuees, heures_prevues, statut, remarques, num_dossier)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,0,0,$24,'actif',$25,$26)
     RETURNING *`,
    [
      d.sexe, d.nationalite, d.typeIdentite, d.numeroIdentite,
      d.prenom, d.prenomAr, d.nom, d.nomAr, nomComplet,
      d.dateNaissance || null, d.lieuNaissance, d.lieuNaissanceAr,
      d.adresse, d.adresseAr, d.ville, d.email, d.telephone,
      d.langue, d.categorie, d.centreImmatriculateur,
      today, d.formule, parseFloat(d.montantTotal) || 0,
      heuresPrevues, d.remarques || '', d.numDossier || '',
    ]
  )
  res.status(201).json(toClient(rows[0]))
})

app.put('/api/clients/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const d = req.body
  const nomComplet = `${d.prenom || ''} ${d.nom || ''}`.trim()
  const { rows } = await pool.query(
    `UPDATE clients SET
      sexe=$1, nationalite=$2, type_identite=$3, numero_identite=$4,
      prenom=$5, prenom_ar=$6, nom=$7, nom_ar=$8, nom_complet=$9,
      date_naissance=$10, lieu_naissance=$11, lieu_naissance_ar=$12,
      adresse=$13, adresse_ar=$14, ville=$15, email=$16, telephone=$17,
      langue=$18, categorie=$19, centre_immatriculateur=$20,
      formule=$21, montant_total=$22, heures_prevues=$23,
      statut=$24, remarques=$25, num_dossier=$26
     WHERE id=$27 RETURNING *`,
    [
      d.sexe, d.nationalite, d.typeIdentite, d.numeroIdentite,
      d.prenom, d.prenomAr, d.nom, d.nomAr, nomComplet,
      d.dateNaissance || null, d.lieuNaissance, d.lieuNaissanceAr,
      d.adresse, d.adresseAr, d.ville, d.email, d.telephone,
      d.langue, d.categorie, d.centreImmatriculateur,
      d.formule, parseFloat(d.montantTotal) || 0, deriveHeuresPrevues(d.formule),
      d.statut, d.remarques || '', d.numDossier || '',
      id,
    ]
  )
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable' })
  res.json(toClient(rows[0]))
})

app.delete('/api/clients/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'UPDATE clients SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    [req.params.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Client introuvable' })
  res.json({ success: true })
})

app.post('/api/clients/:id/restore', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE clients SET deleted_at = NULL WHERE id = $1 RETURNING *',
    [req.params.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable' })
  res.json(toClient(rows[0]))
})

app.delete('/api/clients/:id/permanent', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM clients WHERE id = $1 AND deleted_at IS NOT NULL',
    [req.params.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Client introuvable' })
  res.json({ success: true })
})

app.patch('/api/clients/:id/contrat-date', async (req, res) => {
  const id = parseInt(req.params.id)
  const today = todayMorocco()
  const { rows } = await pool.query(
    'UPDATE clients SET date_contrat = $1 WHERE id = $2 RETURNING *',
    [today, id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Client introuvable' })
  res.json(toClient(rows[0]))
})

// ─── Reservations ─────────────────────────────────────────────────────────────

app.get('/api/reservations', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM reservations ORDER BY date ASC, heure ASC')
  res.json(rows.map(toReservation))
})

app.get('/api/reservations/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM reservations WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Réservation introuvable' })
  res.json(toReservation(rows[0]))
})

app.post('/api/reservations', async (req, res) => {
  const d = req.body
  const { rows } = await pool.query(
    `INSERT INTO reservations (type, client_id, client_nom, clients_data, date, heure, statut)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      d.type || 'réservation',
      d.clientId ? parseInt(d.clientId) : null,
      d.clientNom || '',
      d.clientsData?.length ? JSON.stringify(d.clientsData) : null,
      d.date, d.heure, d.statut || 'confirmé',
    ]
  )
  res.status(201).json(toReservation(rows[0]))
})

app.put('/api/reservations/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const d = req.body
  const { rows } = await pool.query(
    `UPDATE reservations SET type=$1, client_id=$2, client_nom=$3, clients_data=$4, date=$5, heure=$6, statut=$7
     WHERE id=$8 RETURNING *`,
    [
      d.type || 'réservation',
      d.clientId ? parseInt(d.clientId) : null,
      d.clientNom || '',
      d.clientsData?.length ? JSON.stringify(d.clientsData) : null,
      d.date, d.heure, d.statut, id,
    ]
  )
  if (!rows.length) return res.status(404).json({ error: 'Réservation introuvable' })
  res.json(toReservation(rows[0]))
})

app.delete('/api/reservations/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM reservations WHERE id = $1', [req.params.id])
  if (!rowCount) return res.status(404).json({ error: 'Réservation introuvable' })
  res.json({ success: true })
})

// ─── Payments ─────────────────────────────────────────────────────────────────

app.get('/api/payments', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM payments ORDER BY date DESC')
  res.json(rows.map(toPayment))
})

app.get('/api/payments/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Paiement introuvable' })
  res.json(toPayment(rows[0]))
})

app.post('/api/payments', async (req, res) => {
  const d = req.body
  const today = todayMorocco()
  const { rows } = await pool.query(
    `INSERT INTO payments (client_id, client_nom, montant, mode, note, date, statut)
     VALUES ($1,$2,$3,$4,$5,$6,'payé') RETURNING *`,
    [d.clientId ? parseInt(d.clientId) : null, d.clientNom || '', parseFloat(d.montant) || 0, d.mode || 'Espèces', d.note || '', today]
  )
  if (d.clientId) await pool.query(
    'UPDATE clients SET montant_paye = montant_paye + $1 WHERE id = $2',
    [parseFloat(d.montant) || 0, parseInt(d.clientId)]
  )
  res.status(201).json(toPayment(rows[0]))
})

app.put('/api/payments/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const d = req.body
  const { rows: old } = await pool.query('SELECT * FROM payments WHERE id = $1', [id])
  if (!old.length) return res.status(404).json({ error: 'Paiement introuvable' })
  const oldMontant = parseFloat(old[0].montant) || 0
  const newMontant = parseFloat(d.montant) || 0
  const { rows } = await pool.query(
    `UPDATE payments SET montant=$1, mode=$2, note=$3 WHERE id=$4 RETURNING *`,
    [newMontant, d.mode, d.note || '', id]
  )
  const diff = newMontant - oldMontant
  if (diff !== 0) {
    await pool.query(
      'UPDATE clients SET montant_paye = GREATEST(0, montant_paye + $1) WHERE id = $2',
      [diff, old[0].client_id]
    )
  }
  res.json(toPayment(rows[0]))
})

app.delete('/api/payments/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Paiement introuvable' })
  await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id])
  await pool.query(
    'UPDATE clients SET montant_paye = GREATEST(0, montant_paye - $1) WHERE id = $2',
    [parseFloat(rows[0].montant) || 0, rows[0].client_id]
  )
  res.json({ success: true })
})

// ─── Attendance ───────────────────────────────────────────────────────────────

app.get('/api/attendance', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM attendance ORDER BY date DESC')
  res.json(rows.map(toAttendance))
})

app.post('/api/attendance', async (req, res) => {
  const d = req.body
  const { rows } = await pool.query(
    `INSERT INTO attendance (client_id, client_nom, date, heure, statut, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [parseInt(d.clientId), d.clientNom || '', d.date, d.heure || '', d.statut || 'présent', d.notes || '']
  )
  if (rows[0].statut === 'présent') {
    await pool.query(
      'UPDATE clients SET heures_effectuees = heures_effectuees + 1 WHERE id = $1',
      [parseInt(d.clientId)]
    )
  }
  res.status(201).json(toAttendance(rows[0]))
})

app.put('/api/attendance/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const { rows: old } = await pool.query('SELECT * FROM attendance WHERE id = $1', [id])
  if (!old.length) return res.status(404).json({ error: 'Séance introuvable' })

  const oldStatut = old[0].statut
  const newStatut = req.body.statut || oldStatut
  const { rows } = await pool.query(
    `UPDATE attendance SET statut=$1, notes=$2, date=$3, heure=$4 WHERE id=$5 RETURNING *`,
    [newStatut, req.body.notes ?? old[0].notes, req.body.date ?? old[0].date, req.body.heure ?? old[0].heure, id]
  )

  if (oldStatut !== 'présent' && newStatut === 'présent') {
    await pool.query('UPDATE clients SET heures_effectuees = heures_effectuees + 1 WHERE id = $1', [old[0].client_id])
  } else if (oldStatut === 'présent' && newStatut !== 'présent') {
    await pool.query('UPDATE clients SET heures_effectuees = GREATEST(0, heures_effectuees - 1) WHERE id = $1', [old[0].client_id])
  }

  res.json(toAttendance(rows[0]))
})

app.delete('/api/attendance/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM attendance WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Séance introuvable' })
  await pool.query('DELETE FROM attendance WHERE id = $1', [req.params.id])
  if (rows[0].statut === 'présent') {
    await pool.query('UPDATE clients SET heures_effectuees = GREATEST(0, heures_effectuees - 1) WHERE id = $1', [rows[0].client_id])
  }
  res.json({ success: true })
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
  if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' })
  const valid = await bcrypt.compare(password, rows[0].password_hash)
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' })
  res.json({ username: rows[0].username, nom: rows[0].nom, role: rows[0].role })
})

app.post('/api/auth/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
  if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' })
  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash)
  if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
  const hash = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, username])
  res.json({ success: true })
})

// ─── Scan CIN ─────────────────────────────────────────────────────────────────

let ocrWorkerFr = null
let ocrWorkerAr = null

async function getWorkerFr() {
  if (!ocrWorkerFr) ocrWorkerFr = await createWorker('fra', 1, { logger: () => {} })
  return ocrWorkerFr
}
async function getWorkerAr() {
  if (!ocrWorkerAr) ocrWorkerAr = await createWorker('ara', 1, { logger: () => {} })
  return ocrWorkerAr
}

async function preprocessImage(base64) {
  const buf = Buffer.from(base64, 'base64')
  return await sharp(buf).grayscale().normalize().sharpen().toBuffer()
}

const stripAr = s => s.replace(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g, '').replace(/\s+/g, ' ').trim()

function getField(lines, labelRe) {
  for (let i = 0; i < lines.length; i++) {
    const clean = stripAr(lines[i]).toUpperCase()
    const m = clean.match(labelRe)
    if (!m) continue
    const rest = clean.slice(m.index + m[0].length).replace(/^[\s:\/\-]+/, '').trim()
    if (rest.length > 1) return rest
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const next = stripAr(lines[j]).replace(/[^A-ZÀÂÉÈÊËÎÏÔÙÛÜ\s\-]/gi, '').trim()
      if (next.length > 1) return next.toUpperCase()
    }
  }
  return null
}

function parseMRZ(text) {
  const result = {}
  const lines = text.split('\n')
    .map(l => l.replace(/[^A-Z0-9<]/g, '').trim())
    .filter(l => l.length >= 20)

  const l1 = lines.find(l => /IDMAR/i.test(l))
  if (l1) {
    const m = l1.match(/IDMAR([A-Z]{1,2}\d{5,6})/)
    if (m) result.numeroIdentite = m[1]
  }

  const l2 = lines.find(l => /\d{6}[0-9<][MF]/.test(l))
  if (l2) {
    const m = l2.match(/(\d{2})(\d{2})(\d{2})[0-9<]([MF])/)
    if (m) {
      const yy = parseInt(m[1])
      const yyyy = yy > 25 ? 1900 + yy : 2000 + yy
      result.dateNaissance = `${yyyy}-${m[2]}-${m[3]}`
      result.sexe = m[4]
    }
  }

  const l3 = lines.find(l => l.includes('<<') && !/IDMAR/.test(l) && !/\d{6}/.test(l))
  if (l3) {
    const parts = l3.split('<<')
    if (parts[0]) result.nom = parts[0].replace(/</g, ' ').trim()
    if (parts[1]) result.prenom = parts[1].replace(/[<\s]+$/, '').replace(/</g, ' ').trim()
  }

  return result
}

const VILLES_LIST = ['AGADIR','BENI MELLAL','CASABLANCA','DAKHLA','EL JADIDA','ERRACHIDIA','FES','GUELMIM','KENITRA','KHOURIBGA','LAAYOUNE','LARACHE','MARRAKECH','MEKNES','MOHAMMEDIA','NADOR','OUARZAZATE','OUJDA','RABAT','SAFI','SALE','SETTAT','TANGER','TETOUAN','TIZNIT']

app.post('/api/scan-cin', async (req, res) => {
  try {
    const { front, back } = req.body
    const updates = {}

    if (front) {
      const processed = await preprocessImage(front)
      const wFr = await getWorkerFr()
      const { data: { text } } = await wFr.recognize(processed)

      Object.assign(updates, parseMRZ(text))

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const fullUpper = stripAr(text).toUpperCase()

      if (!updates.numeroIdentite) {
        const m = fullUpper.match(/\b([A-Z]{1,2})\s*(\d{5,6})\b/)
        if (m) updates.numeroIdentite = m[1] + m[2]
      }
      if (!updates.dateNaissance) {
        const m = text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/)
        if (m) updates.dateNaissance = `${m[3]}-${m[2]}-${m[1]}`
      }
      if (!updates.sexe) {
        const m = fullUpper.match(/SEXE\s*[:\s]+([MF])\b/)
        if (m) updates.sexe = m[1]
        else if (/\bMASCULIN\b/.test(fullUpper)) updates.sexe = 'M'
        else if (/\bF[EÉ]MININ\b/.test(fullUpper)) updates.sexe = 'F'
      }
      if (!updates.nom) {
        const v = getField(lines, /\bNOM\b/)
        if (v) updates.nom = v.replace(/[^A-ZÀÂÉÈÊËÎÏÔÙÛÜ\s\-]/gi, '').trim()
      }
      if (!updates.prenom) {
        const v = getField(lines, /\bPR[EÉ]NOM\b/)
        if (v) updates.prenom = v.replace(/[^A-ZÀÂÉÈÊËÎÏÔÙÛÜ\s\-]/gi, '').trim()
      }
      const lieuM = fullUpper.match(/\bA\s*[:\s]+([A-ZÀÂÉÈÊËÎÏÔÙÛÜ]{3}[A-ZÀÂÉÈÊËÎÏÔÙÛÜ\s\-]*)/)
      if (lieuM) updates.lieuNaissance = lieuM[1].trim()
    }

    if (back) {
      const processed = await preprocessImage(back)
      const wFr = await getWorkerFr()
      const { data: { text } } = await wFr.recognize(processed)
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const adresse = getField(lines, /\bADRESSE\b/)
      if (adresse) updates.adresse = adresse.toUpperCase()
      const found = VILLES_LIST.find(v => stripAr(text).toUpperCase().includes(v))
      if (found) updates.ville = found
    }

    if (front) {
      const processed = await preprocessImage(front)
      const wAr = await getWorkerAr()
      const { data: { text: textAr } } = await wAr.recognize(processed)
      const arLines = textAr.split('\n').map(l => l.trim()).filter(l => /[؀-ۿ]{2,}/.test(l))
      if (arLines[0]) updates.prenomAr = arLines[0]
      if (arLines[1]) updates.nomAr = arLines[1]
    }

    res.json(updates)
  } catch (err) {
    console.error('scan-cin error:', err)
    res.status(500).json({ error: 'Extraction échouée' })
  }
})

// ─── Frontend (production) ────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
    res.sendFile(join(distPath, 'index.html'))
  })
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`API server: http://localhost:${PORT}`)
})
