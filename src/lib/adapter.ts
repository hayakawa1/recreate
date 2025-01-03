import { Adapter } from 'next-auth/adapters'
import { pool } from './db'

export function CustomAdapter(): Adapter {
  return {
    async createUser(user) {
      const { rows: [newUser] } = await pool.query(
        'INSERT INTO users (id, name, username, image, status, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [crypto.randomUUID(), user.name, user.username, user.image, 'available', '']
      )
      return newUser
    },

    async getUser(id) {
      const { rows: [user] } = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      )
      return user || null
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const { rows: [user] } = await pool.query(
        'SELECT users.* FROM users JOIN accounts ON users.id = accounts.user_id WHERE accounts.provider_account_id = $1 AND accounts.provider = $2',
        [providerAccountId, provider]
      )
      return user || null
    },

    async updateUser(user) {
      const { rows: [updatedUser] } = await pool.query(
        'UPDATE users SET name = $1, username = $2, image = $3 WHERE id = $4 RETURNING *',
        [user.name, user.username, user.image, user.id]
      )
      return updatedUser
    },

    async linkAccount(account) {
      await pool.query(
        'INSERT INTO accounts (id, user_id, provider, provider_account_id, type, access_token, expires_at, refresh_token, scope, token_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          crypto.randomUUID(),
          account.userId,
          account.provider,
          account.providerAccountId,
          account.type,
          account.access_token,
          account.expires_at,
          account.refresh_token,
          account.scope,
          account.token_type
        ]
      )
      return account
    },

    async createSession({ sessionToken, userId, expires }) {
      await pool.query(
        'INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, $3)',
        [sessionToken, userId, expires]
      )
      return { sessionToken, userId, expires }
    },

    async getSessionAndUser(sessionToken) {
      const { rows: [result] } = await pool.query(
        `SELECT 
          s.session_token, s.user_id, s.expires,
          u.id, u.name, u.username, u.image, u.status, u.description
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.session_token = $1 AND s.expires > NOW()`,
        [sessionToken]
      )

      if (!result) return null

      return {
        session: {
          sessionToken: result.session_token,
          userId: result.user_id,
          expires: result.expires
        },
        user: {
          id: result.id,
          name: result.name,
          username: result.username,
          image: result.image,
          status: result.status,
          description: result.description
        }
      }
    },

    async updateSession({ sessionToken, expires }) {
      const { rows: [session] } = await pool.query(
        'UPDATE sessions SET expires = $1 WHERE session_token = $2 RETURNING *',
        [expires, sessionToken]
      )
      return session ? { sessionToken, expires } : null
    },

    async deleteSession(sessionToken) {
      await pool.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken])
    }
  }
} 