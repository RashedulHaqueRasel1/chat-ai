import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Guest / Developer Access',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'developer' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Authenticate developer / user session
        if (credentials?.username) {
          return {
            id: 'dev_user_1',
            name: credentials.username,
            email: `${credentials.username}@local.dev`,
            role: 'developer',
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'cinetext_secret_key_development_only',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
