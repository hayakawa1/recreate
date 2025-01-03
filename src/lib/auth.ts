import { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { Pool } from 'pg';
import crypto from 'crypto';

if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
  throw new Error('Missing Twitter OAuth credentials');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: '2.0',
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        // Twitterのプロファイルデータを安全に取得
        const twitterProfile = profile as any;
        token.twitter_id = twitterProfile.data.id;
        token.username = twitterProfile.data.username;
        token.name = twitterProfile.data.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.twitter_id) {
        try {
          const result = await pool.query(
            `SELECT id, username, name, description, status
            FROM users
            WHERE twitter_id = $1`,
            [token.twitter_id]
          );

          if (result.rows[0]) {
            session.user.id = result.rows[0].id;
            session.user.username = result.rows[0].username;
            session.user.name = result.rows[0].name;
            (session.user as any).description = result.rows[0].description;
            (session.user as any).status = result.rows[0].status;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      return session;
    },
    async signIn({ user, profile }) {
      if (!profile) return false;

      try {
        const twitterProfile = profile as any;
        const twitter_id = twitterProfile.data.id;
        const username = twitterProfile.data.username;
        const name = twitterProfile.data.name;

        // ユーザーの存在確認
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE twitter_id = $1',
          [twitter_id]
        );

        if (existingUser.rows.length === 0) {
          // 新規ユーザーの作成
          await pool.query(
            `INSERT INTO users (id, twitter_id, username, name, image, status)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [crypto.randomUUID(), twitter_id, username, name, user.image, 'available']
          );
        } else {
          // 既存ユーザーの更新（ユーザー名が変更されている可能性がある）
          await pool.query(
            `UPDATE users 
            SET username = $1, name = $2, image = $3
            WHERE twitter_id = $4`,
            [username, name, user.image, twitter_id]
          );
        }

        return true;
      } catch (error) {
        console.error('Error creating/updating user:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 