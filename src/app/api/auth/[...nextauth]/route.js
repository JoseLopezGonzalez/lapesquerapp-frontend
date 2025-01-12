import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch('https://api.congeladosbrisamar.es/api/v2/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          const data = await res.json();

          if (res.ok && data.access_token) {
            return { ...data.user, accessToken: data.access_token };
          }

          throw new Error(data.message || 'Error al iniciar sesión');
        } catch (err) {
          console.error('Error al autenticar:', err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Usar JWT para almacenar la sesión
    maxAge: 60 * 60 * 24 * 7, // Tiempo de vida del token en segundos (7 días)
    updateAge: 60 * 60 * 24, // Tiempo en segundos para actualizar el token (1 día)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
