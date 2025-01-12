import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Laravel API',
      credentials: {
        email: { label: 'Email', type: 'email' },
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

          if (!res.ok) {
            throw new Error(data.message || 'Credenciales inválidas');
          }

          // Si el inicio de sesión es exitoso, devolver los datos del usuario
          return { ...data.user, token: data.access_token };
        } catch (err) {
          console.error('Error during login:', err.message);
          return null; // Devuelve null para indicar que no se autorizó
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.role = user.role; // Incluye el rol si está disponible en la respuesta
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token; // Incluye el token en la sesión
      return session;
    },
  },
  pages: {
    signIn: '/login', // Página personalizada de login
  },
  secret: process.env.NEXTAUTH_SECRET, // Genera un valor secreto en .env.local
});

export { handler as GET, handler as POST };
