import pg from 'pg'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env') })

// Return DATE columns as plain strings (YYYY-MM-DD) to avoid timezone shifts
pg.types.setTypeParser(1082, val => val)

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
