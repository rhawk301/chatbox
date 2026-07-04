/**
 * config-safe-backup.ts
 *
 * Writes secret-stripped snapshots of config.json to ~/.config/xyz.chatboxapp.app/
 * using a staggered retention scheme:
 *   - 7 daily   snapshots  (daily-YYYY-MM-DD.json)
 *   - 4 weekly  snapshots  (weekly-YYYY-Www.json)
 *   - 3 monthly snapshots  (monthly-YYYY-MM.json)
 *
 * API keys, tokens, passwords, and secrets are replaced with empty strings so
 * backups are safe to store and inspect without exposing credentials.
 *
 * To disable: set env var CHATBOX_DISABLE_SAFE_BACKUP=1 before launch,
 * or flip ENABLED to false and rebuild.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'

const ENABLED = process.env.CHATBOX_DISABLE_SAFE_BACKUP !== '1'

export const SAFE_BACKUP_DIR = path.join(os.homedir(), '.config', 'xyz.chatboxapp.app')

// Fields matching this pattern are replaced with '' in backups.
// Targets ApiKey / ApiToken suffixes, known auth token field names,
// licenseKey, and passwords — while preserving blob-ref fields like
// backgroundImageKey and userAvatarKey (which are not credentials).
const SECRET_PATTERN =
  /ApiKey$|ApiToken$|BearerToken$|SecretKey$|SessionToken$|Password$|Credential$|^licenseKey$|^memorizedManualLicenseKey$|^accessToken$|^refreshToken$|^apiKey$|^apiToken$|^secretKey$|^sessionToken$/

function stripSecrets(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(stripSecrets)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_PATTERN.test(k) && typeof v === 'string' ? '' : stripSecrets(v)
  }
  return out
}

// ISO 8601 week string: YYYY-Www
function isoWeek(d: Date): string {
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1))
  const week = Math.ceil(((d.getTime() - weekStart.getTime()) / 86400000 + 1) / 7)
  const year =
    week >= 52 && d.getMonth() === 0
      ? d.getFullYear() - 1
      : week === 1 && d.getMonth() === 11
        ? d.getFullYear() + 1
        : d.getFullYear()
  return `${year}-W${String(week).padStart(2, '0')}`
}

type Tier = { prefix: string; key(d: Date): string; keep: number }

const TIERS: Tier[] = [
  { prefix: 'daily-',   key: (d) => d.toISOString().slice(0, 10), keep: 7 },
  { prefix: 'weekly-',  key: (d) => isoWeek(d),                   keep: 4 },
  { prefix: 'monthly-', key: (d) => d.toISOString().slice(0, 7),  keep: 3 },
]

function listTierFiles(prefix: string): string[] {
  try {
    return fs
      .readdirSync(SAFE_BACKUP_DIR)
      .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
      .sort()
  } catch {
    return []
  }
}

async function writeTier(tier: Tier, now: Date, stripped: unknown): Promise<void> {
  const filename = `${tier.prefix}${tier.key(now)}.json`
  const filepath = path.join(SAFE_BACKUP_DIR, filename)
  if (fs.existsSync(filepath)) return // already have one for this period
  await fs.ensureDir(SAFE_BACKUP_DIR)
  await fs.writeJson(filepath, stripped, { spaces: 2 })
}

async function pruneTier(tier: Tier): Promise<void> {
  const files = listTierFiles(tier.prefix)
  const excess = files.slice(0, Math.max(0, files.length - tier.keep))
  for (const f of excess) {
    await fs.remove(path.join(SAFE_BACKUP_DIR, f))
  }
}

export async function safeBackup(config: object): Promise<void> {
  if (!ENABLED) return
  const now = new Date()
  const stripped = stripSecrets(config)
  for (const tier of TIERS) {
    await writeTier(tier, now, stripped)
    await pruneTier(tier)
  }
}
