import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import TwitterProvider from "next-auth/providers/twitter";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          username: profile.data.username,
          image: profile.data.profile_image_url?.replace('_normal.', '.'),
          email: null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitter") {
        const twitterProfile = profile as {
          data: {
            id: string;
            name: string;
            username: string;
            profile_image_url: string;
          }
        };
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
          if (existingUser) {
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                username: twitterProfile.data.username,
                image: twitterProfile.data.profile_image_url?.replace('_normal.', '.'),
              },
            });
          }
        } catch (error) {
          console.error("Failed to update username:", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
          },
        });
        if (dbUser?.username) {
          token.username = dbUser.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}; 