import { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { getPool } from '@/lib/db';
import crypto from 'crypto';

if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
  throw new Error('Missing Twitter OAuth credentials');
}

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
        token.name = twitterProfile.data.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.twitter_id) {
        return session;
      }

      try {
        const pool = getPool();
        const result = await pool.query(
          `SELECT id, name, description, status
          FROM users
          WHERE twitter_id = $1`,
          [token.twitter_id]
        );

        if (!result.rows[0]) {
          console.error('User not found in database');
          return session;
        }

        session.user.id = result.rows[0].id;
        session.user.name = result.rows[0].name;
        (session.user as any).description = result.rows[0].description;
        (session.user as any).status = result.rows[0].status;
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      return session;
    },
    async signIn({ user, profile }) {
      if (!profile) return false;

      try {
        const pool = getPool();
        const twitterProfile = profile as any;
        const twitter_id = twitterProfile.data.id;
        const name = twitterProfile.data.name;

        // ユーザーの存在確認
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE twitter_id = $1',
          [twitter_id]
        );

        if (existingUser.rows.length === 0) {
          // 新規ユーザーの作成
          await pool.query(
            `INSERT INTO users (id, twitter_id, name, image, status)
            VALUES ($1, $2, $3, $4, $5)`,
            [crypto.randomUUID(), twitter_id, name, user.image, 'unavailable']
          );
        } else {
          // 既存ユーザーの更新
          await pool.query(
            `UPDATE users 
            SET name = $1, image = $2
            WHERE twitter_id = $3`,
            [name, user.image, twitter_id]
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