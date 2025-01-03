import { AuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { CustomAdapter } from './adapter'

export const authOptions: AuthOptions = {
  adapter: CustomAdapter(),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
        session.user.username = user.username
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
} 