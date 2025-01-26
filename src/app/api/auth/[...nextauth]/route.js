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
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar token cada 1 día
  },
  callbacks: {
    async jwt({ token, user }) {
      // Si el usuario está presente (inicia sesión), agregar datos al token
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }

      // Validar si el token ha expirado o es inválido (simular esto con un backend en el futuro)
      const tokenIsExpired = false; // Implementa lógica de validación aquí si es necesario

      if (tokenIsExpired) {
        console.log('Token expirado');
        return null;
      }

      return token;
    },
    async session({ session, token }) {
      // Si no hay token (por ejemplo, expiró), cerrar sesión automáticamente
      if (!token) {
        return null;
      }
      session.user = token;
      return session;
    },
  },
  events: {
    async signOut(message) {
      console.log('Usuario deslogueado:', message);
    },
  },
  pages: {
    signIn: '/login', // Página personalizada de inicio de sesión
    error: '/login', // Redirigir a login en caso de error
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
