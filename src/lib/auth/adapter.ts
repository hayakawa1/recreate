import { Adapter } from 'next-auth/adapters'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export function CustomAdapter(): Adapter {
  return {
    async createUser(user) {
      const { rows } = await pool.query(
        'INSERT INTO users (id, name, email, image, username) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [crypto.randomUUID(), user.name, user.email, user.image, user.username]
      )
      return rows[0]
    },

    async getUser(id) {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
      return rows[0] || null
    },

    async getUserByEmail(email) {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      return rows[0] || null
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const { rows } = await pool.query(
        `SELECT users.* FROM users 
         JOIN accounts ON accounts.user_id = users.id 
         WHERE accounts.provider_account_id = $1 
         AND accounts.provider = $2`,
        [providerAccountId, provider]
      )
      return rows[0] || null
    },

    async updateUser(user) {
      const { rows } = await pool.query(
        'UPDATE users SET name = $1, email = $2, image = $3, username = $4 WHERE id = $5 RETURNING *',
        [user.name, user.email, user.image, user.username, user.id]
      )
      return rows[0]
    },

    async linkAccount(account) {
      await pool.query(
        `INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id, 
          refresh_token, access_token, expires_at, token_type, scope, id_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          crypto.randomUUID(),
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token,
          account.access_token,
          account.expires_at,
          account.token_type,
          account.scope,
          account.id_token,
        ]
      )
    },

    async createSession(session) {
      const { rows } = await pool.query(
        'INSERT INTO sessions (id, session_token, user_id, expires) VALUES ($1, $2, $3, $4) RETURNING *',
        [crypto.randomUUID(), session.sessionToken, session.userId, session.expires]
      )
      return rows[0]
    },

    async getSessionAndUser(sessionToken) {
      const { rows } = await pool.query(
        `SELECT sessions.*, users.* FROM sessions 
         JOIN users ON sessions.user_id = users.id 
         WHERE sessions.session_token = $1`,
        [sessionToken]
      )
      if (rows[0]) {
        const { id, session_token, user_id, expires, ...user } = rows[0]
        return {
          session: { id, sessionToken: session_token, userId: user_id, expires },
          user
        }
      }
      return null
    },

    async updateSession(session) {
      const { rows } = await pool.query(
        'UPDATE sessions SET expires = $1 WHERE session_token = $2 RETURNING *',
        [session.expires, session.sessionToken]
      )
      return rows[0]
    },

    async deleteSession(sessionToken) {
      await pool.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken])
    }
  }
} 